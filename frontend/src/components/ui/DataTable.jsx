import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';

const DataTable = ({ data, columns, loading, onRowClick }) => {
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="w-full bg-[#0D1424] rounded-[10px] border border-[#1E2D45] overflow-hidden">
        <div className="animate-pulse">
          <div className="h-10 bg-[#111827] border-b border-[#1E2D45]"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 border-b border-[#1E2D45] bg-[#0D1424]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0D1424] rounded-[10px] border border-[#1E2D45] overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-[#111827] border-b border-[#1E2D45]">
              {headerGroup.headers.map((header) => {
                const isSorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`p-3 font-['DM_Sans'] text-[11px] uppercase tracking-wider ${
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:text-[#E8EDF5]' : ''
                    } ${isSorted ? 'text-[#00C8E0]' : 'text-[#8899AE]'}`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSorted === 'asc' && <ArrowUp size={12} className="text-[#00C8E0]" />}
                      {isSorted === 'desc' && <ArrowDown size={12} className="text-[#00C8E0]" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="font-['JetBrains_Mono'] text-[13px] text-[#E8EDF5]">
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => onRowClick && onRowClick(row.original)}
              className={`border-b border-[#1E2D45] last:border-0 transition-colors ${
                i % 2 === 0 ? 'bg-[#0D1424]' : 'bg-[#0A0F1A]'
              } hover:bg-[#141E30] ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
