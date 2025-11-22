import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selectedValues, onChange, disabled = false, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newSelectedValues);
  };

  const getButtonLabel = () => {
    if (selectedValues.length === 0) return placeholder || `All ${label}s`;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} ${label}s Selected`;
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor={`${label}-multiselect`} className="sr-only">{label}</label>
      <button
        id={`${label}-multiselect`}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-gray-900 text-left flex justify-between items-center disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonLabel()}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-300 rounded-md">
           <div className="p-2 border-b border-gray-200">
             <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                   <SearchIcon className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder={`Search ${label}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-brand-blue focus:border-brand-blue"
                  style={{ colorScheme: 'light' }}
                  onClick={(e) => e.stopPropagation()} 
                />
             </div>
           </div>
          <ul role="listbox" className="max-h-52 overflow-auto">
            {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <li
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className="cursor-pointer select-none relative py-2 pl-10 pr-4 hover:bg-blue-50"
                    role="option"
                    aria-selected={selectedValues.includes(option)}
                  >
                    <div className="flex items-center">
                       <input
                         type="checkbox"
                         checked={selectedValues.includes(option)}
                         readOnly
                         className="absolute left-3 h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                         style={{ colorScheme: 'light' }}
                       />
                       <span className={`font-normal block truncate text-gray-900 ${selectedValues.includes(option) ? 'font-medium' : 'font-normal'}`}>
                         {option}
                       </span>
                    </div>
                  </li>
                ))
            ) : (
                <li className="text-center text-sm text-gray-500 py-2 px-4">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;