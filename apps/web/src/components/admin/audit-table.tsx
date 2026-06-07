'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

export type AuditRow = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  payload: string;
};

const columns: ColumnDef<AuditRow>[] = [
  { accessorKey: 'ts', header: 'Fecha' },
  { accessorKey: 'actor', header: 'Responsable' },
  { accessorKey: 'action', header: 'Acción' },
  { accessorKey: 'target', header: 'Registro' },
  { accessorKey: 'payload', header: 'Detalle' },
];

export function AuditTable({ data }: { data: AuditRow[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-product-muted dark:bg-product-900/40 text-product-deep dark:text-product-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className="px-3 py-2 font-semibold" key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td className="max-w-xs px-3 py-2 align-top text-foreground-muted" key={cell.id}>
                  <span className="line-clamp-3 break-words">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-foreground-muted">Sin actividad para este filtro.</div>
      ) : null}
    </div>
  );
}
