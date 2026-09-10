import React from 'react';
import { Loader2 } from 'lucide-react';

export function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found',
  className = '',
  onRowClick,
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-slate-200 text-left text-sm ${className}`}>
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || col.accessor || idx}
                  scope="col"
                  className={`px-5 py-3.5 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="text-xs font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || col.accessor || colIdx}
                      className={`whitespace-nowrap px-5 py-4 ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(row[col.accessor], row, rowIdx)
                        : col.accessor
                        ? row[col.accessor] ?? '—'
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
