#!/usr/bin/env Rscript
# Precompute per-gene statistics for a spatial cohort — the cohort-parameterized
# version of stats_tigerlc.R, so each new cohort drop is an invocation instead of
# a new script. Load the output CSV with load_stats_table.mjs.
#
# Mirrors the columns of the single-cell *_stats tables (see database/stats.R):
# overall per-gene count / percent / mean / stdev / stderr, plus the same five
# broken down by cell type (count.<Type>, percent.<Type>, ...). Cell-type names
# are used verbatim — types with spaces (e.g. "T cell") yield column names with
# spaces, which DuckDB handles via quoted identifiers.
#
# Unlike stats.R (which pivots the wide cells CSV to long format), this reads the
# SPARSE expression matrix directly — pivoting millions of cells x thousands of
# genes to long format would exhaust memory. It streams over column blocks,
# accumulating per-gene count / sum / sum-of-squares overall and per cell type,
# so peak memory stays near the matrix itself: materializing even one per-type
# sub-matrix (or the squared matrix) doubled the footprint and broke the 4.66M-
# cell European cohort on a 18 GB machine. "count" = cells with expression > 0;
# mean/stdev are over ALL cells (zeros included), matching stats.R. sd uses the
# sample (n-1) denominator.
#
# Usage: Rscript stats_cohort.R <matrix_rds> <meta_rds> <out_csv>
suppressMessages({
  library(Matrix)
  library(data.table)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 3) {
  stop("usage: Rscript stats_cohort.R <matrix_rds> <meta_rds> <out_csv>")
}
matrix_rds <- args[1]
meta_rds <- args[2]
out_csv <- args[3]

cat("reading meta + expr...\n")
meta <- readRDS(meta_rds)
expr <- readRDS(matrix_rds) # genes x cells
stopifnot(ncol(expr) == nrow(meta))
# Per-cell-type stats select matrix columns POSITIONALLY from meta row order
# (see the loop below), so a meta shipped in a different order than the matrix
# columns would silently assign cells to the wrong cell type. Assert the 1:1
# order join the same way import_cohort.R does: colnames match cell_id (CosMx)
# or the meta rownames (CODEX, where cell_id repeats across samples).
stopifnot(
  identical(colnames(expr), meta$cell_id) || identical(colnames(expr), rownames(meta))
)
genes <- rownames(expr)
ng <- length(genes)
ncells <- ncol(expr)
cell_types <- as.character(meta$cellType)
types <- sort(unique(cell_types))

# One accumulator per group (overall + each cell type): per-gene
# expressing-cell count, value sum, and sum of squares, plus the group's cell
# count.
new_acc <- function() list(count = numeric(ng), sum = numeric(ng), sumsq = numeric(ng), n = 0)
overall_acc <- new_acc()
type_accs <- setNames(lapply(types, function(...) new_acc()), types)

# Per-gene partial sums over a set of cell columns of the sparse matrix.
# cells expressing = stored entries with value > 0 (a dgCMatrix can hold
# explicit zeros / negatives, so count those out to match stats.R).
accumulate <- function(acc, m) {
  x <- m@x
  rows <- m@i + 1L
  acc$count <- acc$count + tabulate(rows[x > 0], nbins = ng)
  acc$sum <- acc$sum + Matrix::rowSums(m)
  # rowsum over the entry vector avoids materializing a squared copy of the
  # whole matrix — only this block's x^2 temp exists at a time
  sq <- rowsum(x * x, rows)
  idx <- as.integer(rownames(sq))
  acc$sumsq[idx] <- acc$sumsq[idx] + sq[, 1]
  acc$n <- acc$n + ncol(m)
  acc
}

block <- 200000L
starts <- seq(1L, ncells, by = block)
cat("accumulating over", length(starts), "column blocks...\n")
for (s in starts) {
  e <- min(s + block - 1L, ncells)
  mb <- expr[, s:e, drop = FALSE]
  bt <- cell_types[s:e]
  overall_acc <- accumulate(overall_acc, mb)
  for (ty in unique(bt)) {
    type_accs[[ty]] <- accumulate(type_accs[[ty]], mb[, bt == ty, drop = FALSE])
  }
  rm(mb)
}

finalize <- function(acc) {
  n <- acc$n
  mean <- acc$sum / n
  var <- if (n > 1) (acc$sumsq - n * mean^2) / (n - 1) else rep(NA_real_, ng)
  var[var < 0] <- 0 # guard tiny negative from float error
  stdev <- sqrt(var)
  data.table(
    count = acc$count,
    percent = 100 * acc$count / n,
    mean = mean,
    stdev = stdev,
    stderr = stdev / sqrt(n)
  )
}

res <- data.table(gene = genes)
res[, c("count", "percent", "mean", "stdev", "stderr") := finalize(overall_acc)]
for (ty in types) {
  st <- finalize(type_accs[[ty]])
  setnames(st, paste0(c("count", "percent", "mean", "stdev", "stderr"), ".", ty))
  res <- cbind(res, st)
}

fwrite(res, out_csv, na = "") # empty -> NULL so DuckDB infers numeric columns
cat("DONE", nrow(res), "genes ->", out_csv, "| cols:", ncol(res), "\n")
