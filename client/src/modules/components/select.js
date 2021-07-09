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
}) {
  const [inputItems, setInputItems] = useState(options);

  const {
    isOpen,
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
}
