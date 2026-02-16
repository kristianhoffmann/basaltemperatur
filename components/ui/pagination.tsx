'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
  className?: string;
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis

  // If total pages is less than what we want to show, show all
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, 'ellipsis', ...rightRange];
  }

  if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
  }

  return [];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const pages = generatePageNumbers(currentPage, totalPages, siblingCount);

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Vorherige Seite"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="w-10 h-10 flex items-center justify-center text-gray-400"
            >
              <MoreHorizontal className="w-5 h-5" />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
        )}
        aria-label="Nächste Seite"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}

// Simple Pagination with info text
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: SimplePaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-3',
        className
      )}
    >
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{startItem}</span>
        {' - '}
        <span className="font-medium text-gray-700">{endItem}</span>
        {' von '}
        <span className="font-medium text-gray-700">{totalItems}</span>
        {' Ergebnissen'}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
        >
          Zurück
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
            'border-gray-300 text-gray-700 hover:bg-gray-50',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
          )}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}

// Page Size Selector
interface PageSizeSelectorProps {
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function PageSizeSelector({
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className,
}: PageSizeSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className="text-sm text-gray-500">Anzeigen:</label>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-500">pro Seite</span>
    </div>
  );
}
