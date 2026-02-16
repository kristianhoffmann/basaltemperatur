import { cn } from '@/lib/utils';
import { type ReactNode, type HTMLAttributes } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// Base Table Components
interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full text-sm text-left', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({ children, className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn('bg-gray-50 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-100', className)} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  selected?: boolean;
  clickable?: boolean;
}

export function TableRow({
  children,
  className,
  selected = false,
  clickable = false,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        selected && 'bg-primary-50',
        clickable && 'cursor-pointer hover:bg-gray-50',
        !selected && !clickable && 'hover:bg-gray-50/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function TableHead({
  children,
  className,
  sortable = false,
  sortDirection = null,
  onSort,
  ...props
}: TableHeadProps) {
  const SortIcon = sortDirection === 'asc'
    ? ChevronUp
    : sortDirection === 'desc'
    ? ChevronDown
    : ChevronsUpDown;

  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:text-gray-900',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <SortIcon
            className={cn(
              'w-4 h-4',
              sortDirection ? 'text-primary-600' : 'text-gray-400'
            )}
          />
        )}
      </div>
    </th>
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('px-4 py-3 text-gray-700', className)}
      {...props}
    >
      {children}
    </td>
  );
}

// Empty State for Tables
interface TableEmptyProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  colSpan: number;
}

export function TableEmpty({
  title = 'Keine Daten',
  description = 'Es wurden keine Einträge gefunden.',
  action,
  colSpan,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <div className="text-center">
          <p className="text-gray-900 font-medium">{title}</p>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

// Table with Card wrapper
interface TableCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function TableCard({
  children,
  title,
  description,
  action,
  className,
}: TableCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// Checkbox for table selection
interface TableCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  'aria-label'?: string;
}

export function TableCheckbox({
  checked,
  onChange,
  indeterminate = false,
  'aria-label': ariaLabel = 'Auswählen',
}: TableCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
    />
  );
}
