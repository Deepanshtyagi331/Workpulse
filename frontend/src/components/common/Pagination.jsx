import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  limit = 10,
  onPageChange,
  disabled = false,
  className = '',
}) {
  const startItem = totalItems ? Math.min((currentPage - 1) * limit + 1, totalItems) : null;
  const endItem = totalItems ? Math.min(currentPage * limit, totalItems) : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-700 ${className}`}
    >
      {/* Items count summary */}
      <div className="text-xs text-slate-500">
        {totalItems != null ? (
          <span>
            Showing <strong className="text-slate-900 font-medium">{startItem}</strong> to{' '}
            <strong className="text-slate-900 font-medium">{endItem}</strong> of{' '}
            <strong className="text-slate-900 font-medium">{totalItems}</strong> results
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-900 font-medium">{currentPage}</strong> of{' '}
            <strong className="text-slate-900 font-medium">{totalPages || 1}</strong>
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="px-2 text-xs font-semibold text-slate-600">
          {currentPage} / {totalPages || 1}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
