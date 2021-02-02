create index "malignant_cell__type" on "malignant_cell"("type");
create index "nonmalignant_cell__type" on "nonmalignant_cell"("type");
create index "t_cell__type" on "t_cell"("type");
create index "cd4_cell__type" on "cd4_cell"("type");
create index "cd8_cell__type" on "cd8_cell"("type");

create index "malignant_cell_gene_count__gene" on "malignant_cell_gene_count"("gene");
create index "malignant_cell_gene_count__count" on "malignant_cell_gene_count"("count");

create index "nonmalignant_cell_gene_count__gene" on "nonmalignant_cell_gene_count"("gene");
create index "nonmalignant_cell_gene_count__count" on "nonmalignant_cell_gene_count"("count");

create index "t_cell_gene_count__gene" on "t_cell_gene_count"("gene");
create index "t_cell_gene_count__count" on "t_cell_gene_count"("count");

create index "cd4_cell_gene_count__gene" on "cd4_cell_gene_count"("gene");
create index "cd4_cell_gene_count__count" on "cd4_cell_gene_count"("count");

create index "cd8_cell_gene_count__gene" on "cd8_cell_gene_count"("gene");
create index "cd8_cell_gene_count__count" on "cd8_cell_gene_count"("count");