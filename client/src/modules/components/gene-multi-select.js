import { useEffect, useState, forwardRef } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

// Multi-select gene picker, styled after the Samples MultiSelect but with
// gene-list semantics: no "Select all" (a whole-panel selection is
// meaningless), `value` is always a concrete gene array, and the checkbox list
// renders incrementally on scroll instead of mounting thousands of rows.
// Used by the gene-set create modal ("select genes from the multi-select
// list", NCIATWP-10327 AC2); reusable for the proteomics pages later.
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

export default function GeneMultiSelect({
  options,
  value,
  onChange,
  label = "genes",
  disabled = false,
}) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(200);
  useEffect(() => {
    setVisibleCount(200);
  }, [search]);

  const selected = new Set(value);
  const filtered = options.filter((o) =>
    o.toLowerCase().startsWith(search.toLowerCase()),
  );

  function toggle(gene) {
    const next = new Set(selected);
    if (next.has(gene)) next.delete(gene);
    else next.add(gene);
    onChange(options.filter((o) => next.has(o))); // stable panel order
  }

  const summary =
    value.length === 0
      ? `Select ${label}…`
      : value.length === 1
        ? value[0]
        : `${value.length} ${label} selected`;

  return (
    <Dropdown autoClose="outside">
      <Dropdown.Toggle as={InputToggle} disabled={disabled}>
        {summary}
      </Dropdown.Toggle>
      <Dropdown.Menu
        className="w-100 p-2"
        style={{ maxHeight: "300px", overflowY: "auto" }}
        onScroll={(event) => {
          const { scrollTop, scrollHeight, clientHeight } = event.target;
          if (scrollHeight - scrollTop - clientHeight < 100) {
            setVisibleCount((count) =>
              count < filtered.length ? count + 200 : count,
            );
          }
        }}>
        <Form.Control
          size="sm"
          type="search"
          placeholder={`Search ${label}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="d-flex align-items-center gap-2 mb-2">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => onChange([])}>
            Clear
          </Button>
          <span className="text-muted small">{value.length} selected</span>
        </div>
        {filtered.length === 0 && (
          <div className="text-muted small px-1">No matches</div>
        )}
        {filtered.slice(0, visibleCount).map((gene) => (
          <Form.Check
            key={gene}
            type="checkbox"
            id={`gms-${label}-${gene}`}
            label={gene}
            checked={selected.has(gene)}
            onChange={() => toggle(gene)}
          />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
