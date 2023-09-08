drop table if exists tumor_cell;
drop table if exists tumor_cell_stats;
create table tumor_cell as select * from read_csv_auto('tumor_cell.csv.gz', parallel = false);
create table tumor_cell_stats as select * from read_csv_auto('tumor_cell_stats.csv.gz', parallel = false);

drop table if exists normal_cell;
drop table if exists normal_cell_stats;
create table normal_cell as select * from read_csv_auto('normal_cell.csv.gz', parallel = false);
create table normal_cell_stats as select * from read_csv_auto('normal_cell_stats.csv.gz', parallel = false);

drop table if exists multiregional_tumor_cell;
drop table if exists multiregional_tumor_cell_stats;
create table multiregional_tumor_cell as select * from read_csv_auto('multiregional_tumor_cell.csv.gz', parallel = false);
create table multiregional_tumor_cell_stats as select * from read_csv_auto('multiregional_tumor_cell_stats.csv.gz', parallel = false);

drop table if exists multiregional_normal_cell;
drop table if exists multiregional_normal_cell_stats;
create table multiregional_normal_cell as select * from read_csv_auto('multiregional_normal_cell.csv.gz', parallel = false);
create table multiregional_normal_cell_stats as select * from read_csv_auto('multiregional_normal_cell_stats.csv.gz', parallel = false);

drop table if exists longitudinal_tumor_cell;
drop table if exists longitudinal_tumor_cell_stats;
create table longitudinal_tumor_cell as select * from read_csv_auto('longitudinal_tumor_cell.csv.gz', parallel = false);
create table longitudinal_tumor_cell_stats as select * from read_csv_auto('longitudinal_tumor_cell_stats.csv.gz', parallel = false);

drop table if exists longitudinal_normal_cell;
drop table if exists longitudinal_normal_cell_stats;
create table longitudinal_normal_cell as select * from read_csv_auto('longitudinal_normal_cell.csv.gz', parallel = false);
create table longitudinal_normal_cell_stats as select * from read_csv_auto('longitudinal_normal_cell_stats.csv.gz', parallel = false);

drop table if exists cd4_cell;
drop table if exists cd4_cell_stats;
create table cd4_cell as select * from read_csv_auto('cd4_cell.csv.gz', parallel = false);
create table cd4_cell_stats as select * from read_csv_auto('cd4_cell_stats.csv.gz', parallel = false);

drop table if exists cd8_cell;
drop table if exists cd8_cell_stats;
create table cd8_cell as select * from read_csv_auto('cd8_cell.csv.gz', parallel = false);
create table cd8_cell_stats as select * from read_csv_auto('cd8_cell_stats.csv.gz', parallel = false);

drop table if exists t_cell;
drop table if exists t_cell_stats;
create table t_cell as select * from read_csv_auto('t_cell.csv.gz', parallel = false);
create table t_cell_stats as select * from read_csv_auto('cd8_cell_stats.csv.gz', parallel = false);

