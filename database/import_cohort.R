#!/usr/bin/env Rscript
# Export a client-provided CosMx cohort (expression .rds + meta .rds) as wide CSV
# chunks for DuckDB — the cohort-parameterized version of import_tigerlc.R, so each
# new cohort drop is an invocation instead of a new script.
#
# Inputs:
#   - <matrix_rds>: dgCMatrix, genes x cells; values are log-normalized expression
#     (the client's "rawCount" file naming is historical — the values are normalized).
#   - <meta_rds>: data.frame with cell_id, x_slide_mm, y_slide_mm, sample_id,
#     cellType (extra columns are ignored); rows join 1:1 in order to the matrix
#     columns, asserted below.
#
# Output: CSV chunks <prefix>_NNN.csv, each rows=cells with columns
#   cell_id, x, y, type, sample, <gene...>
# The loader (load_cohort.mjs) reads these into a typed table named <prefix>.
#
# Usage: Rscript import_cohort.R <matrix_rds> <meta_rds> <out_dir> <prefix> [chunk_rows]
# Size chunk_rows to the cohort's width: keep rows x genes around ~12M values per
# chunk so the loader's COPY stays within a few GB of RAM (e.g. 2000 rows at ~6k
# genes, 12000 rows at ~1k genes).
suppressMessages({
  library(Matrix)
  library(data.table)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 4) {
  stop("usage: Rscript import_cohort.R <matrix_rds> <meta_rds> <out_dir> <prefix> [chunk_rows]")
}
matrix_rds <- args[1]
meta_rds <- args[2]
out_dir <- args[3]
prefix <- args[4]
chunk <- if (length(args) >= 5) as.integer(args[5]) else 2000L
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

cat("reading meta...\n")
meta <- readRDS(meta_rds)
meta_dt <- data.table(
  cell_id = meta$cell_id,
  x = meta$x_slide_mm,
  y = meta$y_slide_mm,
  type = meta$cellType,
  sample = meta$sample_id
)

cat("reading expr matrix (large)...\n")
expr <- readRDS(matrix_rds) # genes x cells
stopifnot(ncol(expr) == nrow(meta_dt))
stopifnot(identical(colnames(expr), meta$cell_id)) # order must match
genes <- rownames(expr)
ncells <- ncol(expr)
meta_names <- names(meta_dt)
cat("cells:", ncells, " genes:", length(genes), "\n")

starts <- seq(1L, ncells, by = chunk)
for (i in seq_along(starts)) {
  s <- starts[i]
  e <- min(s + chunk - 1L, ncells)
  dense <- t(as.matrix(expr[, s:e, drop = FALSE])) # rows=cells, cols=genes
  dt <- cbind(meta_dt[s:e], as.data.table(dense))
  setnames(dt, c(meta_names, genes))
  f <- file.path(out_dir, sprintf("%s_%03d.csv", prefix, i))
  fwrite(dt, f)
  cat("wrote", basename(f), "rows", nrow(dt), "\n")
  rm(dense, dt)
  gc(FALSE)
}
cat("DONE chunks:", length(starts), " genes:", length(genes), " cells:", ncells, "\n")
