#!/bin/sh
# Apply a delta DuckDB file from S3 onto the tier database on EFS.
# Runs as a one-off ECS Fargate task (see .github/workflows/data-import.yml).
#
# The live file stays untouched while the web service reads it. All heavy work
# happens on the task's local disk: the live database is copied to /tmp, the
# delta's tables are merged into that copy in row batches (bounded memory),
# and the finished file is written back to EFS once and swapped in with a
# single atomic rename over the live path (the previous file stays reachable
# as .bak via a hard link, so the configured path never disappears). The web
# service must be restarted afterwards - the backend reads the schema once at
# startup.
#
# Env: DELTA_S3_URI        s3://... of the delta file (built by copy_tables.mjs)
#      TABLES              space-separated tables to copy out of the delta;
#                          empty = every table the delta carries
#      DATABASE_PATH       the live database (e.g. /data/scatlaslc.db)
#      DUCKDB_MEMORY_LIMIT DuckDB buffer cap, sized below the task memory
#      BATCH_ROWS          rows per insert batch (default 100000)
set -eu
: "${DELTA_S3_URI:?}" "${DATABASE_PATH:?}"
MEMORY_LIMIT="${DUCKDB_MEMORY_LIMIT:-4GB}"
BATCH_ROWS="${BATCH_ROWS:-100000}"

WORK=/tmp/data-import
DELTA="$WORK/delta.db"
STAGE="$WORK/scatlaslc.db"   # merge happens here, on local disk
NEW="${DATABASE_PATH}.new"
BAK="${DATABASE_PATH}.bak"

# leave nothing half-written on EFS if the task is stopped mid-run
cleanup() { rm -f "$NEW" "$NEW.wal"; }
trap 'echo "terminated - cleaning up"; cleanup; exit 143' TERM INT

if [ -e "${DATABASE_PATH}.wal" ]; then
  echo "refusing to run: ${DATABASE_PATH}.wal exists (the live database has uncommitted changes)" >&2
  exit 1
fi
rm -rf "$WORK"; mkdir -p "$WORK/duckdb_tmp"
cleanup   # stale .new/.new.wal from an interrupted earlier run must not be replayed

echo "downloading $DELTA_S3_URI"
aws s3 cp "$DELTA_S3_URI" "$DELTA" --no-progress
echo "probing the delta"
duckdb -readonly "$DELTA" "SELECT 1" >/dev/null   # a corrupt/incompatible file fails here, loudly

if [ -z "$(printf '%s' "${TABLES:-}" | tr -d ' ')" ]; then
  LIST=$(duckdb -readonly -csv -noheader "$DELTA" \
    "SELECT table_name FROM information_schema.tables WHERE table_schema='main' ORDER BY table_name")
  TABLES=$(printf '%s' "$LIST" | tr '\n' ' ')
  echo "no TABLES given - applying every table in the delta: $TABLES"
fi
[ -n "$(printf '%s' "$TABLES" | tr -d ' ')" ] || { echo "the delta contains no tables" >&2; exit 1; }
for t in $TABLES; do
  case "$t" in
    *[!a-z0-9_]*) echo "table name must be lower_snake_case: $t" >&2; exit 1 ;;
  esac
done

echo "copying the live database to local disk"
cp "$DATABASE_PATH" "$STAGE"

# One SQL script: settings, attach the delta, then per table create an empty
# copy and fill it in batches with a CHECKPOINT after each, so the wide gene
# tables never need the whole table in memory at once.
#
# Batch by the `sample` column when the table has one: sample is a real,
# zone-mapped column over sample-contiguous data, so each batch scans only its
# own row groups. rowid predicates are NOT pushed into the scan of an attached
# database — every rowid batch re-scanned the entire table with its blocks
# pinned, which ran the 4.66M x 6,208 European cohort out of memory at any
# batch size (the batches were "smaller" only in what they kept, not in what
# they read). rowid ranges remain the fallback for sample-less tables, which
# are all narrow.
SQL="$WORK/apply.sql"
{
  echo ".bail on"
  echo "SET memory_limit='$MEMORY_LIMIT';"
  echo "SET temp_directory='$WORK/duckdb_tmp';"
  echo "SET threads TO 2;"
  echo "SET preserve_insertion_order=false;"
  echo "ATTACH '$DELTA' AS src (READ_ONLY);"
  for t in $TABLES; do
    n=$(duckdb -readonly -csv -noheader "$DELTA" "SELECT count(*) FROM \"$t\"")
    has_sample=$(duckdb -readonly -csv -noheader "$DELTA" \
      "SELECT count(*) FROM information_schema.columns WHERE table_schema='main' AND table_name='$t' AND column_name='sample'")
    echo "DROP TABLE IF EXISTS \"$t\";"
    echo "CREATE TABLE \"$t\" AS SELECT * FROM src.\"$t\" LIMIT 0;"
    if [ "$has_sample" = "1" ] && [ "$n" -gt "$BATCH_ROWS" ]; then
      duckdb -readonly -csv -noheader "$DELTA" \
        "SELECT DISTINCT sample FROM \"$t\" ORDER BY sample" | while IFS= read -r sm; do
        esc=$(printf '%s' "$sm" | sed "s/'/''/g")
        echo "INSERT INTO \"$t\" SELECT * FROM src.\"$t\" WHERE sample = '$esc';"
        echo "CHECKPOINT;"
      done
    else
      off=0
      while [ "$off" -lt "$n" ]; do
        echo "INSERT INTO \"$t\" SELECT * FROM src.\"$t\" WHERE rowid >= $off AND rowid < $((off + BATCH_ROWS));"
        echo "CHECKPOINT;"
        off=$((off + BATCH_ROWS))
      done
    fi
    echo "SELECT '$t' AS applied_table, count(*) AS row_count, $n AS expected FROM \"$t\";"
  done
} > "$SQL"

echo "applying delta (memory_limit $MEMORY_LIMIT, $BATCH_ROWS rows per batch)"
duckdb "$STAGE" < "$SQL"
rm -f "$STAGE.wal"

echo "writing the updated database to EFS"
cp "$STAGE" "$NEW"

echo "swapping in the updated database"
ln -f "$DATABASE_PATH" "$BAK"   # .bak = the current inode; the live path is untouched
mv -f "$NEW" "$DATABASE_PATH"   # one same-filesystem rename: atomic replacement
rm -rf "$WORK"

echo "done - restart the web service to pick up the new file"
