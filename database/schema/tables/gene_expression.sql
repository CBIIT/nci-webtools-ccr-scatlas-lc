drop table if exists "$TABLE_PREFIX_gene_expression_$GENE";
create table "$TABLE_PREFIX_gene_expression_$GENE"
(
    id bigint, 
    $TABLE_PREFIX_id bigint,
    value double
);

create view "v_$TABLE_PREFIX_gene_expression_$GENE" as
select 
    gene_expression."id" as "id",
    source."x" as "x",
    source."y" as "y",
    source."type" as "type",
    gene_expression."value" as "value"
from "$TABLE_PREFIX_gene_expression_$GENE" gene_expression
join "$TABLE_PREFIX" source on gene_expression."$TABLE_PREFIX_id" = source."id";
