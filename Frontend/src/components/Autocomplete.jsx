import React, { useState } from "react";

const Autocomplete = ({ suggestions, placeholder }) => {
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userInput, setUserInput] = useState("");


  console.log(suggestions);

  const onChange = (e) => {
    const userInput = e.currentTarget.value;

    const filteredSuggestions = suggestions.filter(
      (suggestion) =>
        suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
    );

    setActiveSuggestion(0);
    setFilteredSuggestions(filteredSuggestions);
    setShowSuggestions(true);
    setUserInput(userInput);
  };

  const onClick = (e) => {
    setActiveSuggestion(0);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setUserInput(e.currentTarget.innerText);
  };

  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      setActiveSuggestion(0);
      setShowSuggestions(false);
      setUserInput(filteredSuggestions[activeSuggestion]);
    } else if (e.keyCode === 38) {
      if (activeSuggestion === 0) {
        return;
      }
      setActiveSuggestion(activeSuggestion - 1);
    } else if (e.keyCode === 40) {
      if (activeSuggestion - 1 === filteredSuggestions.length) {
        return;
      }
      setActiveSuggestion(activeSuggestion + 1);
    }
  };

  let suggestionsListComponent;

  if (showSuggestions && userInput) {
    if (filteredSuggestions.length) {
      suggestionsListComponent = (
        <ul className="absolute z-10 mt-1 w-max bg-white shadow-md rounded-md border border-gray-300">
          {filteredSuggestions.map((suggestion, index) => {
            let className = "py-2 px-4 cursor-pointer";

            return (
              <li
                className={className}
                key={suggestion}
                onClick={onClick}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      );
    } else {
      suggestionsListComponent = (
        <div className="absolute z-10 mt-1 w-64 p-2 bg-white shadow-md rounded-md border border-gray-300">
          <em>No suggestions, you're on your own!</em>
        </div>
      );
    }
  }

  return (
    <div className="rounded-full">
      <input
        type="text"
        className="relative appearance-none bg-white border w-full border-gray-400 rounded-lg lg:rounded-full py-3 px-5 leading-tight focus:outline-none focus:border-gray-500 cursor-pointer"
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        value={userInput}
      />
      {suggestionsListComponent}
    </div>
  );
};

export default Autocomplete;
  