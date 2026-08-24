#!/bin/sh
# Apply a delta DuckDB file from S3 onto the tier database on EFS.
# Runs as a one-off ECS Fargate task (see .github/workflows/data-import.yml).
#
# The live file stays untouched while the web service reads it: the update is
# applied to a copy, then swapped in with atomic renames (the previous file is
# kept as .bak). The web service must be restarted afterwards to pick up the
# new file — the backend reads the schema once at startup.
#
# Env: DELTA_S3_URI  s3://... of the delta file (built by copy_tables.mjs)
#      TABLES        space-separated tables to copy out of the delta; empty =
#                    every table the delta carries
#      DATABASE_PATH the live database (e.g. /data/scatlaslc.db)
set -eu
: "${DELTA_S3_URI:?}" "${DATABASE_PATH:?}"

DELTA=/tmp/delta.db
NEW="${DATABASE_PATH}.new"
BAK="${DATABASE_PATH}.bak"

echo "downloading $DELTA_S3_URI"
aws s3 cp "$DELTA_S3_URI" "$DELTA" --no-progress

if [ -z "${TABLES:-}" ]; then
  TABLES=$(duckdb -readonly -csv -noheader "$DELTA" \
    "SELECT table_name FROM information_schema.tables WHERE table_schema='main' ORDER BY table_name" \
    | tr '\n' ' ')
  echo "no TABLES given - applying every table in the delta: $TABLES"
fi
[ -n "$(echo "$TABLES" | tr -d ' ')" ] || { echo "the delta contains no tables" >&2; exit 1; }
for t in $TABLES; do
  case "$t" in
    *[!a-z0-9_]*) echo "table name must be lower_snake_case: $t" >&2; exit 1 ;;
  esac
done

echo "copying live database aside"
rm -f "$NEW"
cp "$DATABASE_PATH" "$NEW"

SQL=/tmp/apply.sql
{
  # the wide gene tables exceed memory without a disk spill dir
  echo "SET memory_limit='6GB';"
  echo "SET temp_directory='/tmp/duckdb_tmp';"
  echo "SET threads TO 2;"
  echo "SET preserve_insertion_order=false;"
  echo "ATTACH '$DELTA' AS src (READ_ONLY);"
  for t in $TABLES; do
    echo "DROP TABLE IF EXISTS \"$t\";"
    echo "CREATE TABLE \"$t\" AS SELECT * FROM src.\"$t\";"
    echo "CHECKPOINT;"
  done
  for t in $TABLES; do
    echo "SELECT '$t' AS applied_table, count(*) AS row_count FROM \"$t\";"
  done
} > "$SQL"

echo "applying delta"
duckdb "$NEW" < "$SQL"

echo "swapping in the updated database"
rm -f "$BAK"
mv "$DATABASE_PATH" "$BAK"
mv "$NEW" "$DATABASE_PATH"

echo "done — restart the web service to pick up the new file"
