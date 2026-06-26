#!/usr/bin/env Rscript
# Import TIGER-LC CosMx spatial transcriptomics into a wide "cells" table for DuckDB.
#
# Input (client-provided .rds, see the ticket test-files):
#   - rawCount_matrix_tigerlc_cohort.rds : dgCMatrix, genes x cells, log-normalized
#     expression (despite the "rawCount" name the values are already normalized).
#   - meta_table_tigerlc_cohort.rds      : data.frame, cell_id, x_slide_mm, y_slide_mm,
#     sample_id, cellType; rownames join 1:1 (in order) to the expr columns.
#
# Output: CSV chunks, each rows=cells with columns
#   cell_id, x, y, type, sample, <gene...>   (transposed + joined; no normalization).
# The loader (load_tigerlc.mjs) reads these into a typed `tigerlc` table.
#
# Usage: Rscript import_tigerlc.R <in_dir> <out_dir> [chunk_rows]
suppressMessages({
  library(Matrix)
  library(data.table)
})

args <- commandArgs(trailingOnly = TRUE)
in_dir <- if (length(args) >= 1) args[1] else "../docs/tickets/NCIATWP-10327/test-files"
out_dir <- if (length(args) >= 2) args[2] else "/tmp/tigerlc_chunks"
# 2000 rows/chunk keeps each loader COPY within a few GB of RAM (the table is very
# wide); larger chunks risk OOM when the loader builds the wide DuckDB table.
chunk <- if (length(args) >= 3) as.integer(args[3]) else 2000L
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

cat("reading meta...\n")
meta <- readRDS(file.path(in_dir, "meta_table_tigerlc_cohort.rds"))
meta_dt <- data.table(
  cell_id = meta$cell_id,
  x = meta$x_slide_mm,
  y = meta$y_slide_mm,
  type = meta$cellType,
  sample = meta$sample_id
)

cat("reading expr matrix (large)...\n")
expr <- readRDS(file.path(in_dir, "rawCount_matrix_tigerlc_cohort.rds")) # genes x cells
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
  f <- file.path(out_dir, sprintf("tigerlc_%03d.csv", i))
  fwrite(dt, f)
  cat("wrote", basename(f), "rows", nrow(dt), "\n")
  rm(dense, dt)
  gc(FALSE)
}
cat("DONE chunks:", length(starts), " genes:", length(genes), " cells:", ncells, "\n")
