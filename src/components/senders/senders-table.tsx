"use client"

import * as React from "react"
import {
  IconCircleCheck,
  IconCircleX,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AddSenderModal } from "./add-sender-modal"
import { EditSenderModal } from "@/components/senders/edit-sender-modal"
import { sendersApi, type Sender } from "@/lib/senders-api"

export function SendersTable() {
  const [data, setData] = React.useState<Sender[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  const [lastEvaluatedKey, setLastEvaluatedKey] = React.useState<string>("")
  const [hasNextPage, setHasNextPage] = React.useState(false)
  const [hasPreviousPage, setHasPreviousPage] = React.useState(false)
  const [pageKeys, setPageKeys] = React.useState<string[]>([""])
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [selectedSenderId, setSelectedSenderId] = React.useState<string | null>(null)

  // Search state
  const [searchTerm, setSearchTerm] = React.useState("")
  const [searchInput, setSearchInput] = React.useState("")

  // Debounced search with 500ms delay
  const debouncedSearch = React.useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout
      return (value: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          setSearchTerm(value)
          // Reset pagination when searching
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
          setPageKeys([""])
          setLastEvaluatedKey("")
          setHasNextPage(false)
          setHasPreviousPage(false)
        }, 500)
      }
    }, []),
    []
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Fetch senders function using API service
  const fetchSenders = React.useCallback(async (lastKey = "") => {
    try {
      setLoading(true)
      
      const result = await sendersApi.list({
        limit: pagination.pageSize,
        lastKey: lastKey || undefined,
        search: searchTerm || undefined,
      })
      
      setData(result.results)
      setLastEvaluatedKey(result.lastEvaluatedKey || "")
      setHasNextPage(!!result.lastEvaluatedKey)
      setHasPreviousPage(pagination.pageIndex > 0)
      setError(null)
    } catch (err) {
      console.error("API Error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch senders")
      toast.error("Failed to load senders")
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.pageIndex, searchTerm])

  React.useEffect(() => {
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchSenders(currentPageKey)
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, fetchSenders])

  // Handle when a sender is added
  const handleSenderAdded = () => {
    // Reset pagination and refetch first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys([""])
    setLastEvaluatedKey("")
    setHasNextPage(false)
    setHasPreviousPage(false)
    fetchSenders("")
  }

  // Handle edit sender
  const handleEdit = (sender: Sender) => {
    setSelectedSenderId(sender.id)
    setIsEditModalOpen(true)
  }

  // Handle delete sender using API service
  const handleDelete = async (senderId: string) => {
    if (!window.confirm("Are you sure you want to delete this sender?")) {
      return
    }

    try {
      await sendersApi.delete(senderId)
      toast.success("Sender deleted successfully!")
      handleSenderAdded() // Refresh the table
    } catch (err) {
      console.error("Error deleting sender:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete sender")
    }
  }

  // Handle when a sender is updated
  const handleSenderUpdated = () => {
    // Refresh current page
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchSenders(currentPageKey)
  }

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value)
    setPagination(prev => ({
      pageIndex: 0,
      pageSize: newPageSize
    }))
    setPageKeys([""])
    setLastEvaluatedKey("")
    setHasNextPage(false)
    setHasPreviousPage(false)
  }

  const handleNextPage = () => {
    if (hasNextPage && lastEvaluatedKey) {
      const newPageIndex = pagination.pageIndex + 1
      
      if (newPageIndex >= pageKeys.length) {
        setPageKeys(prev => [...prev, lastEvaluatedKey])
      }
      
      setPagination(prev => ({
        ...prev,
        pageIndex: newPageIndex
      }))
    }
  }

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPagination(prev => ({
        ...prev,
        pageIndex: prev.pageIndex - 1
      }))
    }
  }

  // Define columns inside component to access handlers
  const columns: ColumnDef<Sender>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "alias",
      header: "Aliases",
      cell: ({ row }) => {
        const aliases = row.getValue("alias") as string[]
        return (
          <div className="flex flex-wrap gap-1">
            {aliases && aliases.length > 0 ? (
              aliases.slice(0, 3).map((alias, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {alias}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No aliases</span>
            )}
            {aliases && aliases.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{aliases.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "emailType",
      header: "Email Types",
      cell: ({ row }) => {
        const emailTypes = row.getValue("emailType") as string[]
        return (
          <div className="flex flex-wrap gap-1">
            {emailTypes && emailTypes.length > 0 ? (
              emailTypes.slice(0, 2).map((type, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No types</span>
            )}
            {emailTypes && emailTypes.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{emailTypes.length - 2}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("active") as boolean
        return (
          <Badge 
            variant={isActive ? "default" : "destructive"}
            className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
          >
            {isActive ? (
              <>
                <IconCircleCheck className="mr-1 h-3 w-3" />
                Active
              </>
            ) : (
              <>
                <IconCircleX className="mr-1 h-3 w-3" />
                Inactive
              </>
            )}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createUser",
      header: "Created By",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("createUser")}</div>
      ),
    },
    {
      accessorKey: "createDate",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createDate"))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sender = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(sender)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(sender.id)}
                className="text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-muted-foreground">Loading senders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full space-y-4">
        {/* <div className="flex items-center justify-between"> */}
          {/* <Input
            placeholder="Filter emails..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          /> */}
        <div className="flex justify-end">
          <Button onClick={() => setIsModalOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Sender
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
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
                    className="h-24 text-center"
                  >
                    No senders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-4 py-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="page-size" className="text-sm font-medium">
              Show
            </Label>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20" id="page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm font-medium">per page</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Sender Modal */}
      <AddSenderModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        onSenderAddedAction={handleSenderAdded}
      />

      {/* Edit Sender Modal */}
      <EditSenderModal
        isOpen={isEditModalOpen}
        onCloseAction={() => {
          setIsEditModalOpen(false)
          setSelectedSenderId(null)
        }}
        onSenderUpdatedAction={handleSenderUpdated}
        senderId={selectedSenderId}
      />
    </>
  )
}