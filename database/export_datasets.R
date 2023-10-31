suppressMessages(library(dplyr))
suppressMessages(library(tidyr))
suppressMessages(library(vroom))
Sys.setenv(VROOM_CONNECTION_SIZE = 500000)

start_time = Sys.time()
dir.create("datasets", showWarnings = FALSE, recursive = TRUE)

get_stats <- function(data) {
  # Convert to long format
  long_data <- data %>%
    pivot_longer(cols = c(-x, -y, -type), names_to = "gene", values_to = "value")

  # Compute general statistics
  stats <- long_data %>%
    group_by(gene) %>%
    summarize(
      count = sum(value > 0),
      percent = 100 * sum(value > 0) / n(),
      mean = mean(value, na.rm = TRUE),
      stdev = sd(value, na.rm = TRUE),
      stderr = stdev / sqrt(n()),
      .groups = "drop"
    )

  # Compute type-specific statistics
  type_stats <- long_data %>%
    group_by(gene, type) %>%
    summarize(
      count = sum(value > 0),
      percent = 100 * sum(value > 0) / n(),
      mean = mean(value, na.rm = TRUE),
      stdev = sd(value, na.rm = TRUE),
      stderr = stdev / sqrt(n()),
      .groups = "drop"
    ) %>%
    pivot_wider(
      names_from = type,
      values_from = c(count, percent, mean, stdev, stderr),
      names_sep = "."
    )

  # Join overall and type-specific statistics
  results <- stats %>%
    inner_join(type_stats, by = "gene")

  results
}

load("source/sc_liver_obj_nonMalignant_tsne.RData")
normal_cell = sc_liver_obj_nonTumor_tsne %>% rename(x = dim1, y = dim2, type = cellType_7types)
normal_cell_stats = get_stats(normal_cell)
vroom_write(normal_cell, "datasets/normal_cell.csv.gz", delim = ",", na = "")
vroom_write(normal_cell_stats, "datasets/normal_cell_stats.csv.gz", delim = ",", na = "")
rm(sc_liver_obj_nonTumor_tsne, normal_cell, normal_cell_stats)

load("source/sc_liver_obj_malignant_tsne.RData")
tumor_cell = sc_liver_obj_tumor_tsne %>% rename(x = dim1, y = dim2, type = ident)
tumor_cell_stats = get_stats(tumor_cell)
vroom_write(tumor_cell, "datasets/tumor_cell.csv.gz", delim = ",", na = "")
vroom_write(tumor_cell_stats, "datasets/tumor_cell_stats.csv.gz", delim = ",", na = "")
rm(sc_liver_obj_tumor_tsne, tumor_cell, tumor_cell_stats)

load("source/sc_liver_obj_Tcells_tsne.RData")
t_cell = sc_liver_obj_Tcells_tsne %>% rename(x = dim1, y = dim2, type = cellType)
t_cell_stats = get_stats(t_cell)
vroom_write(t_cell, "datasets/t_cell.csv.gz", delim = ",", na = "")
vroom_write(t_cell_stats, "datasets/t_cell_stats.csv.gz", delim = ",", na = "")
rm(sc_liver_obj_Tcells_tsne, t_cell, t_cell_stats)

load("source/Trajectory_CD4.RData")
cd4_cell = trajectory_CD4 %>% rename(x = Component1, y = Component2, type = cellType)
cd4_cell_stats = get_stats(cd4_cell)
vroom_write(cd4_cell, "datasets/cd4_cell.csv.gz", delim = ",", na = "")
vroom_write(cd4_cell_stats, "datasets/cd4_cell_stats.csv.gz", delim = ",", na = "")
rm(trajectory_CD4, cd4_cell, cd4_cell_stats)

load("source/Trajectory_CD8.RData")
cd8_cell = trajectory_CD8 %>% rename(x = Component1, y = Component2, type = cellType)
cd8_cell_stats = get_stats(cd8_cell)
vroom_write(cd8_cell, "datasets/cd8_cell.csv.gz", delim = ",", na = "")
vroom_write(cd8_cell_stats, "datasets/cd8_cell_stats.csv.gz", delim = ",", na = "")
rm(trajectory_CD8, cd8_cell, cd8_cell_stats)

longitudinal_normal_cell = vroom("source/longitudinal/nontumor_data.csv") %>% rename(x = tsne1, y = tsne2, type = cell_type) %>% select(!cell) %>% relocate(type, .after = y)
longitudinal_normal_cell_stats = get_stats(longitudinal_normal_cell)
vroom_write(longitudinal_normal_cell, "datasets/longitudinal_normal_cell.csv.gz", delim = ",", na = "")
vroom_write(longitudinal_normal_cell_stats, "datasets/longitudinal_normal_cell_stats.csv.gz", delim = ",", na = "")
rm(longitudinal_normal_cell, longitudinal_normal_cell_stats)

longitudinal_tumor_cell = vroom("source/longitudinal/tumor_data.csv") %>% rename(x = tsne1, y = tsne2, type = sample) %>% select(!cell) %>% relocate(type, .after = y)
longitudinal_tumor_cell_stats = get_stats(longitudinal_tumor_cell)
vroom_write(longitudinal_tumor_cell, "datasets/longitudinal_tumor_cell.csv.gz", delim = ",", na = "")
vroom_write(longitudinal_tumor_cell_stats, "datasets/longitudinal_tumor_cell_stats.csv.gz", delim = ",", na = "")
rm(longitudinal_tumor_cell, longitudinal_tumor_cell_stats)

multiregional_normal_cell = vroom("source/multiregional/nontumor_data.csv") %>% rename(x = umap1, y = umap2, type = cell_type) %>% select(!cell) %>% relocate(type, .after = y)
multiregional_normal_cell_stats = get_stats(multiregional_normal_cell)
vroom_write(multiregional_normal_cell, "datasets/multiregional_normal_cell.csv.gz", delim = ",", na = "")
vroom_write(multiregional_normal_cell_stats, "datasets/multiregional_normal_cell_stats.csv.gz", delim = ",", na = "")
rm(multiregional_normal_cell, multiregional_normal_cell_stats)

multiregional_tumor_cell = vroom("source/multiregional/tumor_data.csv") %>% rename(x = tsne1, y = tsne2, type = sample) %>% select(!cell) %>% relocate(type, .after = y)
multiregional_tumor_cell_stats = get_stats(multiregional_tumor_cell)
vroom_write(multiregional_tumor_cell, "datasets/multiregional_tumor_cell.csv.gz", delim = ",", na = "")
vroom_write(multiregional_tumor_cell_stats, "datasets/multiregional_tumor_cell_stats.csv.gz", delim = ",", na = "")
rm(multiregional_tumor_cell, multiregional_tumor_cell_stats)

end_time <- Sys.time()
duration <- as.numeric(end_time - start_time, units = "secs")
print(paste("Finished in", round(duration, 2), "seconds."))
