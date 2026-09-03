import { useState, forwardRef } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Toggle styled as a form-control input (white bg, standard input border) so the
// multi-select matches the sibling number/gene inputs instead of a Bootstrap button.
const InputToggle = forwardRef(function InputToggle(
  { children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="form-control text-start d-flex justify-content-between align-items-center"
      {...props}>
      <span className="text-truncate">{children}</span>
      <i className="bi bi-chevron-down ms-2 small text-muted" aria-hidden="true" />
    </button>
  );
});

// Shared multi-select: a searchable checkbox dropdown with Select all / Clear.
// `value` is the array of selected options, or `null` to mean "all selected"
// (the default state) — onChange passes `null` back when everything is selected.
// Built for the spatial Samples filter (130 options); reusable for any list.
export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
}) {
  const [search, setSearch] = useState("");

  const allSelected = value == null;
  const selected = new Set(allSelected ? options : value);
  const isChecked = (o) => selected.has(o);
  const count = allSelected ? options.length : value.length;
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(option) {
    const next = new Set(allSelected ? options : value);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    const arr = options.filter((o) => next.has(o)); // keep stable order
    onChange(arr.length === options.length ? null : arr);
  }

  return (
    <Dropdown autoClose="outside">
      <Dropdown.Toggle as={InputToggle}>
        {allSelected ? allLabel : `${count} of ${options.length} selected`}
      </Dropdown.Toggle>
      <Dropdown.Menu
        className="w-100 p-2"
        style={{ maxHeight: "300px", overflowY: "auto" }}>
        <Form.Control
          size="sm"
          type="search"
          placeholder={`Search ${label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="d-flex gap-2 mb-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onChange(null)}>
            Select all
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
        {filtered.length === 0 && (
          <div className="text-muted small px-1">No matches</div>
        )}
        {filtered.map((option) => (
          <Form.Check
            key={option}
            type="checkbox"
            id={`ms-${label}-${option}`}
            label={option}
            checked={isChecked(option)}
            onChange={() => toggle(option)}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
