drop table if exists "malignant_cell";
create table "malignant_cell"
(
    "id" integer primary key, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "nonmalignant_cell";
create table "nonmalignant_cell"
(
    "id" integer primary key, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "t_cell";
create table "t_cell"
(
    "id" integer primary key, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "malignant_cell_gene_count";
create table "malignant_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

drop table if exists "nonmalignant_cell_gene_count";
create table "nonmalignant_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

drop table if exists "t_cell_gene_count";
create table "t_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

drop table if exists "gene";
create table "gene"
(
    "id" integer primary key autoincrement, 
    "gene" text unique
);

drop table if exists "malignant_cell_type";
create table "malignant_cell_type"
(
    "id" integer primary key autoincrement, 
    "type" text unique
);

drop table if exists "nonmalignant_cell_type";
create table "nonmalignant_cell_type"
(
    "id" integer primary key autoincrement, 
    "type" text unique
);

drop table if exists "t_cell_type";
create table "t_cell_type"
(
    "id" integer primary key autoincrement, 
    "type" text unique
);
