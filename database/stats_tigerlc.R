#!/usr/bin/env Rscript
# Precompute per-gene statistics for the TIGER-LC spatial cohort -> tigerlc_stats.
#
# Mirrors the columns of the single-cell *_stats tables (see database/stats.R): overall
# per-gene count / percent / mean / stdev / stderr, plus the same five broken down by cell
# type (count.<Type>, percent.<Type>, ...). Cell types: Malignant/Immune/Stromal/Epithelial.
#
# Unlike stats.R (which pivots the wide cells CSV to long format), this reads the SPARSE
# expression matrix directly and computes row-wise stats — pivoting 270k cells x 6,175 genes
# to long format would exhaust memory. "count" = cells with expression > 0; mean/stdev are
# over ALL cells (zeros included), matching stats.R. sd uses the sample (n-1) denominator.
#
# Usage: Rscript stats_tigerlc.R <in_dir> <out_csv>
suppressMessages({
  library(Matrix)
  library(data.table)
})

args <- commandArgs(trailingOnly = TRUE)
in_dir <- if (length(args) >= 1) args[1] else "../docs/tickets/NCIATWP-10327/test-files"
out_csv <- if (length(args) >= 2) args[2] else "/tmp/tigerlc_stats.csv"

cat("reading meta + expr...\n")
meta <- readRDS(file.path(in_dir, "meta_table_tigerlc_cohort.rds"))
expr <- readRDS(file.path(in_dir, "rawCount_matrix_tigerlc_cohort.rds")) # genes x cells
stopifnot(ncol(expr) == nrow(meta))
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
