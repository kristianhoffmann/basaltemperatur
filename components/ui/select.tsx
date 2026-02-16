'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  name?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Auswählen...',
  label,
  error,
  hint,
  disabled = false,
  required = false,
  searchable = false,
  clearable = false,
  className,
  name,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={value || ''} />

        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'px-4 py-2.5 text-left text-sm',
            'bg-white border rounded-lg',
            'transition-colors',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500',
            isOpen && 'ring-2 ring-primary-500 border-primary-500'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn(!selectedOption && 'text-gray-500')}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>

          <div className="flex items-center gap-1">
            {clearable && value && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-500 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-white rounded-lg border border-gray-200 shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-100',
              'max-h-60 overflow-auto'
            )}
            role="listbox"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Options */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Keine Optionen gefunden
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                      'transition-colors',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                      !option.disabled && 'hover:bg-gray-50',
                      option.value === value && 'bg-primary-50'
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="w-5 h-5 flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error/Hint */}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}

// Native Select for simpler use cases
interface NativeSelectProps {
  options: Option[];
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
}

export function NativeSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled,
  required,
  className,
  name,
}: NativeSelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full px-4 py-2.5 text-sm',
          'bg-white border rounded-lg',
          'focus:outline-none focus:ring-2',
          'transition-colors appearance-none',
          'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")]',
          'bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat',
          'pr-10',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
