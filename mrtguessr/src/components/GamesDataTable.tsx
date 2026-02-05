import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { UserGame } from '@/lib/api'

interface GamesDataTableProps {
  data: UserGame[]
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function GamesDataTable({
  data,
  page,
  limit,
  total,
  onPageChange,
}: GamesDataTableProps) {
  const columns: ColumnDef<UserGame>[] = [
    {
      accessorKey: 'completedAt',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue('completedAt'))
        return (
          <div className="font-medium">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'totalScore',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.getValue('totalScore') as number
        return (
          <div className="font-bold text-emerald-400">
            {score.toLocaleString()}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Link
            to="/game/results/$uuid"
            params={{ uuid: row.original.uuid }}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            View Results
          </Link>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
  })

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-slate-300 font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-slate-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-400"
                >
                  No games found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-400">
            Showing {Math.min((page - 1) * limit + 1, total)} to{' '}
            {Math.min(page * limit, total)} of {total} games
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPreviousPage}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="text-sm text-slate-300">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
