import React, { useState, useRef } from "react";
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    setInputValue,
  } = useCombobox({
    items: inputItems,
    selectedItem: value,
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        options.filter((option) =>
          option.toLowerCase().startsWith(inputValue.toLowerCase()),
        ),
      );
      setInputValue(inputValue);
      setIsOpen(!!inputValue); // Close the dropdown when there's input
    },
    // Add onSelectedItemChange here
    onSelectedItemChange: ({ selectedItem }) => {
      selectItem(selectedItem);
      setIsInputFocused(false); // Set isInputFocused to false after selecting an item
      setIsOpen(false); // Close the dropdown after selecting an item
      onChange(selectedItem);
    },
  });

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleDropdownBlur = () => {
    if (!isInputFocused) {
      setIsOpen(false); // Close the dropdown when dropdown loses focus
    }
  };

  console.log("isInputFocused -- ", isInputFocused);
  console.log("isOpen ", isOpen);

  return (
    <>
      <label className="visually-hidden" {...getLabelProps()}>
        {label}
      </label>
      <div
        className="w-100"
        {...getComboboxProps()}
        onBlur={handleDropdownBlur}>
        <input
          id={id}
          name={name}
          className={className}
          placeholder={placeholder}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          {...getInputProps()}
        />
      </div>
      <div
        ref={dropdownRef}
        className={classNames(
          "dropdown-menu",
          "overflow-scroll",
          "w-100",
          // isOpen && "show",
          // Add "show" class when input is focused or user types
          { show: isInputFocused || isOpen },
        )}
        style={{ top: "40px", maxHeight: "200px" }}
        tabIndex={-1} // Make the dropdown focusable
        onBlur={handleDropdownBlur} // Handle blur event for dropdown
      >
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
