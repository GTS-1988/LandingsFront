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
    <div className="overflow-x-auto rounded-xl border border-[color:color-mix(in_srgb,var(--text)_10%,white)]">
      <table className="min-w-full divide-y divide-[color:color-mix(in_srgb,var(--text)_10%,white)] text-sm">
        <thead className="bg-[color:color-mix(in_srgb,var(--bg)_72%,white)]">
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
