import React, { useState, useRef, useEffect } from "react";
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
  // leading "clear the filter" entry; pass null to omit it (e.g. the gene-set
  // Add-gene box, where "All genes" is not a valid member to add)
  allOption = "All genes",
}) {
  const updatedOptions = allOption ? [allOption, ...options] : options;
  const [inputItems, setInputItems] = useState(options);
  const [isOpen, setIsOpen] = useState(false);
  // rendered window into inputItems — the full list (6k+ genes) is too many DOM
  // nodes to mount at once, so more rows are appended as the user scrolls
  const [visibleCount, setVisibleCount] = useState(100);
  const dropdownRef = useRef(null);
  useEffect(() => {
    setVisibleCount(100);
  }, [inputItems]);
  useEffect(() => {
    // Set inputItems to include "All genes" when the component mounts
    setInputItems(updatedOptions);
  }, []);

  const handleSelectedItemChange = ({ selectedItem }) => {
    // Close the dropdown before invoking onChange
    setIsOpen(false);

    // Invoke onChange after closing the dropdown
    onChange(selectedItem);

    // Rest of your code
    selectItem(selectedItem);
  };

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
      setInputItems([
        ...(allOption ? [allOption] : []),
        ...options.filter((option) =>
          option.toLowerCase().startsWith(inputValue.toLowerCase()),
        ),
      ]);
      setInputValue(inputValue);
      // open only when the change comes from the user typing in THIS input.
      // The value also changes programmatically (e.g. activating a gene set
      // clears the box) — checking live DOM focus instead of a tracked flag
      // keeps those resets from popping the dropdown open with focus
      // elsewhere, where no blur could ever close it again.
      const active = document.activeElement;
      setIsOpen(!!active && active.getAttribute("name") === name);
    },

    // Add onSelectedItemChange here
    onSelectedItemChange: handleSelectedItemChange,
  });

  // Reopen with the FULL option list: a previously selected value narrows the
  // filtered list to just itself, so without this reset the dropdown only ever
  // shows the active selection again. Selecting the text lets typing replace it.
  // Wired to click as well as focus — selection keeps focus in the input, so a
  // re-click fires no focus event.
  const handleInputFocus = (event) => {
    setIsOpen(true);
    setInputItems(updatedOptions);
    event.target.select();
  };

  const handleDropdownBlur = () => {
    //if (!isInputFocused) {
    setIsOpen(false); // Close the dropdown when dropdown loses focus
    //}
  };

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
          onClick={handleInputFocus}
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
          { show: isOpen },
        )}
        style={{ top: "40px", maxHeight: "200px" }}
        tabIndex={-1} // Make the dropdown focusable
        onBlur={handleDropdownBlur} // Handle blur event for dropdown
        // clicking an option must not steal focus from the input: the resulting
        // blur closed (unmounted) the menu between mousedown and mouseup, so the
        // click never registered on the item and only keyboard Enter could select
        onMouseDown={(event) => event.preventDefault()}
        // append more rows when scrolled near the bottom (the list was silently
        // truncated at 100 before, cutting a 6k-gene list off around ACVR1)
        onScroll={(event) => {
          const { scrollTop, scrollHeight, clientHeight } = event.target;
          if (scrollHeight - scrollTop - clientHeight < 100) {
            setVisibleCount((count) =>
              count < inputItems.length ? count + 200 : count,
            );
          }
        }}>
        <ul className="list-unstyled mb-0" {...getMenuProps()}>
          {isOpen && (
            <>
              {!inputItems.length && (
                <li className="dropdown-item">No items found</li>
              )}
              {inputItems.slice(0, visibleCount).map((item, index) => (
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
