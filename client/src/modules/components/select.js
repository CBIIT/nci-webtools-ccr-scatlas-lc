import { useState } from "react";
import { useCombobox } from "downshift";
import classNames from "classnames";

export default function Select({
  id,
  name,
  label,
  className,
  onChange,
  options,
  placeholder,
  value,
  inputProps,
}) {
  const [inputItems, setInputItems] = useState(options);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: inputItems,
    selectedItem: value,
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        options.filter((option) =>
          option.toLowerCase().startsWith(inputValue.toLowerCase()),
        ),
      );
    },
    onSelectedItemChange: ({ selectedItem, inputValue }) => {
      onChange(selectedItem);
      setIsMenuOpen(false);
    },
  });

  return (
    <>
      <label className="visually-hidden" {...getLabelProps()}>
        {label}
      </label>
      <div className="w-100" {...getComboboxProps()}>
        <input
          id={id}
          name={name}
          className={className}
          placeholder={placeholder}
          {...getInputProps()}
        />
      </div>
      <div
        className={classNames(
          "dropdown-menu",
          "overflow-scroll",
          "w-100",
          isOpen && "show",
        )}
        style={{ top: "40px", maxHeight: "200px" }}>
        <ul className="list-unstyled mb-0" {...getMenuProps()}>
          {isOpen && (
            <>
              {!inputItems.length && (
                <li className="dropdown-item">No items found</li>
              )}
              {inputItems.slice(0, 100).map((item, index) => (
                <li
                  className={classNames(
                    "dropdown-item",
                    highlightedIndex === index && "active",
                  )}
                  key={`${item}${index}`}
                  {...getItemProps({ item, index })}>
                  {item}
                </li>
              ))}
            </>
          )}
        </ul>
      </div>
    </>
  );

  // return (
  //   <select id={id} name={name} value={value || ''} className={className} onChange={onChange} {...inputProps}>
  //     {placeholder && <option value="">{placeholder}</option>}
  //     {options.map((o, i) => <option key={`option-${i}`} value={o.value || o}>{o.label || o}</option>)}
  //   </select>
  // )
}

// <Select
//                             id="plot-gene"
//                             className="w-100"
//                             onChange="{(gene) => mergePlotOptions({gene})}"
//                             options={lookup.gene}
//                             placeholder="All genes"
//                             value={plotOptions.gene}
//                             inputProps={{
//                                 'aria-label': 'Gene Search'
//                             }}
