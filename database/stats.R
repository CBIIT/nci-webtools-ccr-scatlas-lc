library(readr)
library(tidyr)
library(dplyr)
library(vroom)
Sys.setenv(VROOM_CONNECTION_SIZE = 500000)

args <- commandArgs(TRUE)
input_file <- args[1]
output_file <- args[2]

data <- as_tibble(read_csv(input_file))

# Convert to long format
long_data <- data %>%
  pivot_longer(cols = c(-x, -y, -type), names_to = "gene", values_to = "value")

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
    names_sep = "_"
  )

# Join overall and type-specific statistics
results <- stats %>%
  inner_join(type_stats, by = "gene")

print(results)
vroom_write(results, file = output_file, delim = ",")
