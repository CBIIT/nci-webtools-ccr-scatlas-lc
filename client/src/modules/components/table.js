import { useMemo } from 'react';
import BootstrapTable from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Pagination from 'react-bootstrap/Pagination';
import { useTable, useFilters, usePagination, useSortBy } from 'react-table';

export function TextFilter({
    column: { filterValue, setFilter, placeholder }
}) {
    return (
        <Form.Control
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            placeholder={placeholder || `Search...`}
        />
    );
}

export function RangeFilter({
    column: { filterValue = [], setFilter, minPlaceholder, maxPlaceholder },
}) {
    const getInputValue = ev => ev.target.value 
        ? parseInt(ev.target.value, 10) 
        : undefined;

    return (
        <InputGroup className="flex-nowrap">
            <Form.Control 
                placeholder={minPlaceholder || "Min value" }
                type="number"
                value={filterValue[0] || ''}
                onChange={e => setFilter((old = []) => [getInputValue(e), old[1]])}
            />
            <Form.Control 
                placeholder={maxPlaceholder || "Max value" }
                type="number"
                value={filterValue[1] || ''}
                onChange={e => setFilter((old = []) => [old[0], getInputValue(e)])}
            />
        </InputGroup>
    );
}

export default function Table({ columns, data, options }) {

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        rows,

        canPreviousPage,
        canNextPage,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },

    } = useTable(
        {
            columns: useMemo(_ => columns, [columns]),
            data: useMemo(_ => data, [data]),
            ...options,
        },
        useFilters,
        useSortBy,
        usePagination,
    );

    return (
        <>
            <div className="table-responsive">
                <BootstrapTable {...getTableProps()} hover bordered>
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                        {column.render('Header')}
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? <i className="bi bi-sort-down text-primary ml-1" />
                                                : <i className="bi bi-sort-up text-primary ml-1" />
                                            : ''}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>
                                        <div>{column.canFilter ? column.render('Filter') : null}</div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>

                    <tbody {...getTableBodyProps()}>
                        {page.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()}>
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </BootstrapTable>
            </div>

            <div className="d-flex align-items-center justify-content-between px-3">
                <div>
                    Showing rows {(1 + pageIndex * pageSize).toLocaleString()}-{Math.min(rows.length, (pageIndex + 1) * pageSize).toLocaleString()} of {rows.length.toLocaleString()}
                </div>

                <div className="d-flex">
                    <Form.Control
                        as="select"
                        className="mr-2"
                        name="select-page-size"
                        aria-label="Select page size"
                        value={pageSize}
                        onChange={e => setPageSize(Number(e.target.value))}>
                        {[10, 25, 50, 100].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))}
                    </Form.Control>

                    <Pagination>
                        <Pagination.First onClick={() => gotoPage(0)} disabled={!canPreviousPage}>First</Pagination.First>
                        <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage}>Previous</Pagination.Prev>
                        <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage}>Next</Pagination.Next>
                        <Pagination.Last onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>Last</Pagination.Last>
                    </Pagination>
                </div>
            </div>
        </>
    );
}