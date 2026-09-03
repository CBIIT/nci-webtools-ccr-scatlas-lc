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
# SPARSE expression matrix directly and computes row-wise stats — pivoting millions
# of cells x thousands of genes to long format would exhaust memory. "count" =
# cells with expression > 0; mean/stdev are over ALL cells (zeros included),
# matching stats.R. sd uses the sample (n-1) denominator.
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

# Row-wise (per-gene) stats over a set of cell columns of the sparse matrix.
gene_stats <- function(m) {
  n <- ncol(m)
  # cells expressing = stored entries with value > 0 (a dgCMatrix can hold explicit
  # zeros / negatives, so count those out to match stats.R's sum(value > 0))
  pos <- m@x > 0
  count <- tabulate((m@i + 1L)[pos], nbins = nrow(m))
  rs <- Matrix::rowSums(m)
  msq <- m
  msq@x <- msq@x^2
  sumsq <- Matrix::rowSums(msq)
  mean <- rs / n
  var <- if (n > 1) (sumsq - n * mean^2) / (n - 1) else rep(NA_real_, nrow(m))
  var[var < 0] <- 0 # guard tiny negative from float error
  stdev <- sqrt(var)
  data.table(
    count = count,
    percent = 100 * count / n,
    mean = mean,
    stdev = stdev,
    stderr = stdev / sqrt(n)
  )
}

cat("overall stats...\n")
overall <- gene_stats(expr)
res <- data.table(gene = genes)
res[, c("count", "percent", "mean", "stdev", "stderr") := overall]

cat("per-cell-type stats...\n")
for (ty in sort(unique(meta$cellType))) {
  cols <- which(meta$cellType == ty)
  st <- gene_stats(expr[, cols, drop = FALSE])
  setnames(st, paste0(c("count", "percent", "mean", "stdev", "stderr"), ".", ty))
  res <- cbind(res, st)
}

fwrite(res, out_csv, na = "") # empty -> NULL so DuckDB infers numeric columns
cat("DONE", nrow(res), "genes ->", out_csv, "| cols:", ncol(res), "\n")
