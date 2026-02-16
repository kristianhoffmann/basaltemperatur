'use client';

import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Context
interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedValue?: string;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown');
  }
  return context;
}

// Main Dropdown Component
interface DropdownProps {
  children: ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={dropdownRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Trigger Button
interface DropdownTriggerProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export function DropdownTrigger({
  children,
  className,
  asChild = false,
}: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();

  if (asChild) {
    return (
      <div onClick={() => setIsOpen(!isOpen)} className={className}>
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        'inline-flex items-center justify-between gap-2 px-4 py-2',
        'text-sm font-medium text-gray-700',
        'bg-white border border-gray-300 rounded-lg',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'transition-colors',
        className
      )}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
      <ChevronDown
        className={cn(
          'w-4 h-4 text-gray-500 transition-transform',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// Menu Container
interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
  width?: 'auto' | 'trigger' | string;
}

export function DropdownMenu({
  children,
  className,
  align = 'left',
  width = 'auto',
}: DropdownMenuProps) {
  const { isOpen } = useDropdown();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 py-1',
        'bg-white rounded-lg border border-gray-200 shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-100',
        align === 'left' ? 'left-0' : 'right-0',
        width === 'auto' && 'min-w-[12rem]',
        width === 'trigger' && 'w-full',
        className
      )}
      style={typeof width === 'string' && width !== 'auto' && width !== 'trigger' ? { width } : undefined}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>
  );
}

// Menu Item
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  selected?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  shortcut,
  selected = false,
  className,
}: DropdownItemProps) {
  const { setIsOpen } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !destructive && 'text-gray-700 hover:bg-gray-50',
        !disabled && destructive && 'text-red-600 hover:bg-red-50',
        selected && 'bg-primary-50',
        className
      )}
      role="menuitem"
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {selected && <Check className="w-4 h-4 text-primary-600" />}
      {shortcut && (
        <span className="text-xs text-gray-400 ml-auto">{shortcut}</span>
      )}
    </button>
  );
}

// Divider
export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100" role="separator" />;
}

// Label/Group Header
interface DropdownLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        'px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </div>
  );
}

// Simple Action Menu (commonly used pattern)
interface ActionMenuProps {
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    destructive?: boolean;
    disabled?: boolean;
  }>;
  trigger?: ReactNode;
  align?: 'left' | 'right';
}

export function ActionMenu({ actions, trigger, align = 'right' }: ActionMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        {trigger || (
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </DropdownTrigger>
      <DropdownMenu align={align}>
        {actions.map((action, index) => (
          <DropdownItem
            key={index}
            onClick={action.onClick}
            icon={action.icon}
            destructive={action.destructive}
            disabled={action.disabled}
          >
            {action.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
