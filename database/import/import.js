const assert = require('assert');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sqlite = require('better-sqlite3');
const csvReader = require('csv-reader');
const { 
    databaseFilepath, 
    malignantCellsFilepath, 
    nonmalignantCellsFilepath, 
    tCellsFilepath,
    cd4CellsFilepath,
    cd8CellsFilepath,
} = require('minimist')(
    process.argv.slice(2), 
    {
        alias: {
            'database-file': 'databaseFilepath',
            'malignant-cells-file': 'malignantCellsFilepath',
            'nonmalignant-cells-file': 'nonmalignantCellsFilepath',
            't-cells-file': 'tCellsFilepath',
            'cd4-cells-file': 'cd4CellsFilepath',
            'cd8-cells-file': 'cd8CellsFilepath',
            'd': 'databaseFilepath',
            'm': 'malignantCellsFilepath',
            'n': 'nonmalignantCellsFilepath',
            't': 'tCellsFilepath',
            'cd4': 'cd4CellsFilepath',
            'cd8': 'cd8CellsFilepath',
        }
    }
);

if (!(
    databaseFilepath && 
    malignantCellsFilepath && 
    nonmalignantCellsFilepath && 
    tCellsFilepath &&
    cd4CellsFilepath &&
    cd8CellsFilepath
)) {
    console.log(`Usage: node import.js
        --d | --database-file "filepath"
        --m | --malignant-cells-file "filepath"
        --n | --nonmalignant-cells-file "filepath"
        --t | --t-cells-file "filepath"
        --cd4 | --cd4-cells-file "filepath"
        --cd8 | --cd8-cells-file "filepath"
    `);
    process.exit(1);
}

(async function main() {
    await loadFiles({ databaseFilepath, malignantCellsFilepath, nonmalignantCellsFilepath, tCellsFilepath });
    process.exit(0);
})();

function createTimestamp(formatter = v => `${v / 1000}s`) {
    const startTime = new Date().getTime();
    let checkpointTime = new Date().getTime();
    return () => {
        const now = new Date().getTime();
        const times = [now - startTime, now - checkpointTime];
        checkpointTime = now;
        return times.map(formatter);
    }
}

async function loadFiles({ databaseFilepath, malignantCellsFilepath, nonmalignantCellsFilepath, tCellsFilepath }) {
    if (fs.existsSync(databaseFilepath))
        fs.unlinkSync(databaseFilepath);

    const getTimestamp = createTimestamp();
    const db = new sqlite(databaseFilepath);
    const mainTablesSql = await fsp.readFile(path.resolve(__dirname, '../schema/tables/main.sql'), 'utf-8');
    const mainIndexesSql = await fsp.readFile(path.resolve(__dirname, '../schema/indexes/main.sql'), 'utf-8');
    const log = message => console.log(`[${getTimestamp()}] ${message}`);

    const geneExpressionTablesSql = await fsp.readFile(path.resolve(__dirname, '../schema/tables/gene_expression.sql'), 'utf-8');

    db.exec('PRAGMA synchronous = 0');
    db.exec('BEGIN TRANSACTION');
    db.exec(mainTablesSql);

    const files = [
        {
            filepath: malignantCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'ident'],
            tablePrefix: 'malignant_cell',
            insertStmt: db.prepare(`
                insert into malignant_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertTypeStmt: db.prepare(`
                insert into malignant_cell_type("type") 
                select distinct "type" from malignant_cell
            `),
            getInsertGeneExpressionStmt: ({gene}) => db.prepare(`
                insert into "malignant_cell_gene_expression_${gene}"("id", "malignant_cell_id", "value") 
                values (?, ?, ?)
            `),
            getInsertGeneCountStmt: ({gene}) => db.prepare(`
                insert into malignant_cell_gene_count("gene", "count") 
                select '${gene}', count(*) from "malignant_cell_gene_expression_${gene}"
                where value > 0
            `),
        },
        {
            filepath: nonmalignantCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'cellType_7types'],
            tablePrefix: 'nonmalignant_cell',
            insertStmt: db.prepare(`
                insert into nonmalignant_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertTypeStmt: db.prepare(`
                insert into nonmalignant_cell_type("type") 
                select distinct "type" from nonmalignant_cell
            `),
            getInsertGeneExpressionStmt: ({gene}) => db.prepare(`
                insert into "nonmalignant_cell_gene_expression_${gene}"("id", "nonmalignant_cell_id", "value") 
                values (?, ?, ?)
            `),
            getInsertGeneCountStmt: ({gene}) => db.prepare(`
                insert into nonmalignant_cell_gene_count("gene", "count") 
                select '${gene}', count(*) from "nonmalignant_cell_gene_expression_${gene}"
                where value > 0
            `),
        },
        {
            filepath: tCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'cellType'],
            tablePrefix: 't_cell',
            insertStmt: db.prepare(`
                insert into t_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertTypeStmt: db.prepare(`
                insert into t_cell_type("type") 
                select distinct "type" from t_cell
            `),
            getInsertGeneExpressionStmt: ({gene}) => db.prepare(`
                insert into "t_cell_gene_expression_${gene}"("id", "t_cell_id", "value") 
                values (?, ?, ?)
            `),
            getInsertGeneCountStmt: ({gene}) => db.prepare(`
                insert into t_cell_gene_count("gene", "count") 
                select '${gene}', count(*) from "t_cell_gene_expression_${gene}"
                where value > 0
            `),
        },
        {
            filepath: cd4CellsFilepath,
            expectedHeaders: ['Component1', 'Component2', 'cellType'],
            tablePrefix: 'cd4_cell',
            insertStmt: db.prepare(`
                insert into cd4_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertTypeStmt: db.prepare(`
                insert into cd4_cell_type("type") 
                select distinct "type" from cd4_cell
            `),
            getInsertGeneExpressionStmt: ({gene}) => db.prepare(`
                insert into "cd4_cell_gene_expression_${gene}"("id", "cd4_cell_id", "value") 
                values (?, ?, ?)
            `),
            getInsertGeneCountStmt: ({gene}) => db.prepare(`
                insert into cd4_cell_gene_count("gene", "count") 
                select '${gene}', count(*) from "cd4_cell_gene_expression_${gene}"
                where value > 0
            `),
        },
        {
            filepath: cd8CellsFilepath,
            expectedHeaders: ['Component1', 'Component2', 'cellType'],
            tablePrefix: 'cd8_cell',
            insertStmt: db.prepare(`
                insert into cd8_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertTypeStmt: db.prepare(`
                insert into cd8_cell_type("type") 
                select distinct "type" from cd8_cell
            `),
            getInsertGeneExpressionStmt: ({gene}) => db.prepare(`
                insert into "cd8_cell_gene_expression_${gene}"("id", "cd8_cell_id", "value") 
                values (?, ?, ?)
            `),
            getInsertGeneCountStmt: ({gene}) => db.prepare(`
                insert into cd8_cell_gene_count("gene", "count") 
                select '${gene}', count(*) from "cd8_cell_gene_expression_${gene}"
                where value > 0
            `),
        },
    ];

    let genes = [];

    for (const {filepath, expectedHeaders, insertStmt, insertTypeStmt, getInsertGeneExpressionStmt, getInsertGeneCountStmt, tablePrefix} of files) {
        const csvStream = fs.createReadStream(filepath, 'utf8').pipe(new csvReader());
        let id = 0;

        log(`Started import, processing headers for: ${filepath}`);

        // create a buffer to batch inserts into multiple tables
        const geneValuesBuffer = {__size: 0, genes: {}};
        const bufferSize = 200;
        const insertBufferedValues = () => {
            for (const [gene, values] of Object.entries(geneValuesBuffer.genes)) {
                let stmt = getInsertGeneExpressionStmt({gene})
                for (const row of values)
                    stmt.run(row);
                geneValuesBuffer.genes[gene] = [];
            }
            geneValuesBuffer.__size = 0;
        }

        for await (const line of csvStream) {
            const headerValues = line.slice(0, expectedHeaders.length);
            const geneValues = line.slice(expectedHeaders.length)//.slice(0, 100);

            if (id === 0) {
                genes = geneValues;
                assert.deepStrictEqual(headerValues, expectedHeaders);
                for (const gene of genes) {
                    const sql = geneExpressionTablesSql
                        .replace(/\$TABLE_PREFIX/g, tablePrefix)
                        .replace(/\$GENE/g, gene)
                    db.exec(sql);
                    geneValuesBuffer.genes[gene] = [];
                }
                log(`Finished processing ${line.length} headers`);
            } else {
                insertStmt.run([id, ...headerValues]);
                for (let i = 0; i < genes.length; i ++) {
                    let gene = genes[i];
                    let value = geneValues[i];
                    geneValuesBuffer.genes[gene].push([i, id, value]);
                }
                geneValuesBuffer.__size ++;
            }

            if (geneValuesBuffer.__size > bufferSize) {
                log(`Inserting ${bufferSize * genes.length} buffered records across ${genes.length} tables`);
                insertBufferedValues();
                log(`Inserted buffered records`);
            }

            if (id % 1e2 === 0)
                log(`Inserted ${id} records into ${tablePrefix}`);
            
            id++;
        }

        insertBufferedValues();
        
        log(`Imported ${--id} records, calculating counts`);
        for (let gene of genes)
            getInsertGeneCountStmt({gene}).run()

        log(`Calculated counts, importing types`);
        insertTypeStmt.run();

        log(`Imported types, finished import: ${filepath}\n`);
    }

    for (let j = 0; j < genes.length; j ++)
        db.prepare(`insert into gene values (?, ?)`).run([j + 1, genes[j]]);

    log(`Imported all records, creating indexes`);
    db.exec(mainIndexesSql);

    log(`Finished all imports`);

    db.exec('COMMIT');
}
