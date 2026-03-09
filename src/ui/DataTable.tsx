import { ReactNode } from 'react'

type DataTableColumn = {
  label: string
  align?: 'left' | 'right'
}

type DataTableProps = {
  columns: DataTableColumn[]
  children: ReactNode
}

export default function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <thead className="bg-[var(--surface-soft)]">
          <tr>
            {columns.map((column) => (
              <th
                key={`${column.label}-${column.align || 'left'}`}
                className={`px-3 py-2 font-semibold text-[var(--text)] ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  )
}
