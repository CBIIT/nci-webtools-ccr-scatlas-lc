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

drop table if exists "cd4_cell";
create table "cd4_cell"
(
    "id" integer primary key, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "cd8_cell";
create table "cd8_cell"
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

create view "v_malignant_nonmalignant_cell_gene_count" as
select
    m."id" as "id",
    m."gene" as "gene",
    m."count" as "malignant_cell_count",
    n."count" as "nonmalignant_cell_count"
from "malignant_cell_gene_count" m
join "malignant_cell_gene_count" n on m."gene" = n."gene";

drop table if exists "t_cell_gene_count";
create table "t_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

drop table if exists "cd4_cell_gene_count";
create table "cd4_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

drop table if exists "cd8_cell_gene_count";
create table "cd8_cell_gene_count"
(
    "id" integer primary key, 
    "gene" text,
    "count" int
);

create view "v_t_cd4_cd8_cell_gene_count" as
select
    t."id" as "id",
    t."gene" as "gene",
    t."count" as "t_cell_count",
    cd4."count" as "cd4_cell_count",
    cd8."count" as "cd8_cell_count"
from "t_cell_gene_count" t
join "cd4_cell_gene_count" cd4 on t."gene" = cd4."gene"
join "cd8_cell_gene_count" cd8 on t."gene" = cd8."gene";

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

drop table if exists "cd4_cell_type";
create table "cd4_cell_type"
(
    "id" integer primary key autoincrement, 
    "type" text unique
);

drop table if exists "cd8_cell_type";
create table "cd8_cell_type"
(
    "id" integer primary key autoincrement, 
    "type" text unique
);
