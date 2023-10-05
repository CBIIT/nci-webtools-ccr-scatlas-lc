import { useMemo } from "react";
import BootstrapTable from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Pagination from "react-bootstrap/Pagination";
import { useTable, useFilters, usePagination, useSortBy } from "react-table";
import classNames from "classnames";
import { useEffect, useRef } from "react";


export function TextFilter({
  column: { filterValue, setFilter, placeholder, aria },
}) {
  return (
    <Form.Control
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value || undefined)}
      placeholder={placeholder || `Search...`}
      aria-label={aria}
    />
  );
}

export function RangeFilter({
  column: { filterValue = [], setFilter, minPlaceholder, maxPlaceholder, aria },
}) {
  const asInputValue = (value) => (typeof value === "number" ? value : "");
  const getInputValue = ({ target: { value } }) =>
    value ? parseFloat(value, 10) : undefined;

  return (
    <InputGroup className="flex-nowrap">
      <Form.Control
        type="number"
        placeholder={minPlaceholder || "Min value"}
        value={asInputValue(filterValue[0])}
        onChange={(e) => setFilter((old = []) => [getInputValue(e), old[1]])}
        aria-label={aria + " Min"}
      />
      <Form.Control
        type="number"
        placeholder={maxPlaceholder || "Max value"}
        value={asInputValue(filterValue[1])}
        onChange={(e) => setFilter((old = []) => [old[0], getInputValue(e)])}
        aria-label={aria + " Max"}
      />
    </InputGroup>
  );
}

export default function Table({ columns, data, options,selectedGene }) {
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
      columns: useMemo((_) => columns, [columns]),
      data: useMemo((_) => data, [data]),
      ...options,
    },
    useFilters,
    useSortBy,
    usePagination,
    );
    const tableRef = useRef(null);

    useEffect(() => {
      // Find the index of the highlighted row
      const highlightedRowIndex = rows.findIndex(
        (row) => row.original.gene === selectedGene
      );
  
      // Calculate the page that contains the highlighted row
      const highlightedRowPage = Math.floor(highlightedRowIndex / pageSize);
  
      // Navigate to the page if it's not the current page
      if (highlightedRowPage !== pageIndex) {
        gotoPage(highlightedRowPage);
      }
  
      // Scroll to the highlighted row after a delay
      const scrollDelay = 100;
      setTimeout(() => {
        const highlightedRow = tableRef.current.querySelector(".highlighted-row");
        if (highlightedRow) {
          highlightedRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, scrollDelay);
    }, [selectedGene, pageIndex, pageSize, rows, gotoPage]);
    

  return (
    <>
      <div className="table-responsive" ref={tableRef}>
        <BootstrapTable {...getTableProps()} hover bordered>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render("Header")}
                    {column.isSorted && (
                      <i
                        className={classNames(
                          "bi",
                          "text-primary",
                          "ms-1",
                          column.isSortedDesc ? "bi-sort-down" : "bi-sort-up",
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <td {...column.getHeaderProps()}>
                    <div>
                      {column.canFilter ? column.render("Filter") : null}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </thead>

          <tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              const isHighlighted = row.original.gene === selectedGene;

              return (
                <tr {...row.getRowProps()} >
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()} className={isHighlighted ? "highlighted-row" : ""}>{cell.render("Cell")}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </BootstrapTable>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between p-3">
        <div>
          Showing rows {(1 + pageIndex * pageSize).toLocaleString()}-
          {Math.min(rows.length, (pageIndex + 1) * pageSize).toLocaleString()}{" "}
          of {rows.length.toLocaleString()}
        </div>

        <div className="d-flex">
          <Form.Control
            as="select"
            className="me-2"
            name="select-page-size"
            aria-label="Select page size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}>
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </Form.Control>

          <Pagination className="mb-0">
            <Pagination.First
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}>
              First
            </Pagination.First>
            <Pagination.Prev
              onClick={() => previousPage()}
              disabled={!canPreviousPage}>
              Previous
            </Pagination.Prev>
            <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage}>
              Next
            </Pagination.Next>
            <Pagination.Last
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}>
              Last
            </Pagination.Last>
          </Pagination>
        </div>
      </div>
    </>
  );
}
