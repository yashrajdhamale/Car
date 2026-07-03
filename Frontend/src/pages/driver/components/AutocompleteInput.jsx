// src/pages/driver/components/AutocompleteInput.jsx
import React from "react";

const AutocompleteInput = ({ value, onChange, options = [], placeholder }) => {
  return (
    <input
      type="text"
      list="autocomplete-options"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border rounded px-2 py-1"
    >
      <datalist id="autocomplete-options">
        {options.map((opt, idx) => (
          <option key={idx} value={opt} />
        ))}
      </datalist>
    </input>
  );
};

export default AutocompleteInput;
