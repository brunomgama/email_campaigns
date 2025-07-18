"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
  IconUsers,
  IconMail,
  IconDatabase,
  IconRefresh,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { AddAudienceModal } from "./add-audience-modal"
import { EditAudienceModal } from "./edit-audience-modal"
import { audienceApi, type Audience } from "@/lib/audience-api"

export function AudienceTable() {
  const [data, setData] = React.useState<Audience[]>([])
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
  const [selectedAudienceId, setSelectedAudienceId] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

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

  // Fetch audiences function using API service
  const fetchAudiences = React.useCallback(async (lastKey = "") => {
    try {
      setLoading(true)
      
      const result = await audienceApi.list({
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
      setError(err instanceof Error ? err.message : "Failed to fetch audiences")
      toast.error("Failed to load audiences")
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.pageIndex, searchTerm])

  React.useEffect(() => {
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchAudiences(currentPageKey)
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, fetchAudiences])

  // Handle when an audience is added
  const handleAudienceAdded = () => {
    // Reset pagination and refetch first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys([""])
    setLastEvaluatedKey("")
    setHasNextPage(false)
    setHasPreviousPage(false)
    fetchAudiences("")
  }

  // Handle edit audience
  const handleEdit = (audience: Audience) => {
    setSelectedAudienceId(audience.id)
    setIsEditModalOpen(true)
  }

  // Handle delete audience using API service
  const handleDelete = async (audienceId: string) => {
    if (!window.confirm("Are you sure you want to delete this audience?")) {
      return
    }

    try {
      await audienceApi.delete(audienceId)
      toast.success("Audience deleted successfully!")
      handleAudienceAdded() // Refresh the table
    } catch (err) {
      console.error("Error deleting audience:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete audience")
    }
  }

  // Handle when an audience is updated
  const handleAudienceUpdated = () => {
    // Refresh current page
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchAudiences(currentPageKey)
  }

  // Handle refresh recipients count
  const handleRefreshRecipients = async () => {
    if (!data.length) return

    try {
      setIsRefreshing(true)
      
      // Execute recipients count update for all audiences
      const promises = data.map(audience => 
        audienceApi.countRecipients(audience.id)
      )
      
      await Promise.all(promises)
      
      toast.success("Recipients count updated successfully!")
      
      // Refresh the table data
      const currentPageKey = pageKeys[pagination.pageIndex] || ""
      await fetchAudiences(currentPageKey)
      
    } catch (err) {
      console.error("Error refreshing recipients:", err)
      
      // Extract meaningful error message
      let errorMessage = "Failed to update recipients count"
      
      if (err instanceof Error) {
        const fullMessage = err.message
        if (fullMessage.includes("HTTP error! status:") && fullMessage.includes("message:")) {
          const messagePart = fullMessage.split("message: ")[1]
          if (messagePart) {
            errorMessage = messagePart
          }
        } else {
          errorMessage = fullMessage
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsRefreshing(false)
    }
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

  // Get email type badge variant
  const getEmailTypeBadge = (emailType: string) => {
    switch (emailType) {
      case 'campaign':
        return <Badge variant="default">Campaign</Badge>
      case 'automation':
        return <Badge variant="secondary">Automation</Badge>
      case 'functional':
        return <Badge variant="outline">Functional</Badge>
      default:
        return <Badge variant="outline">{emailType}</Badge>
    }
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Define columns inside component to access handlers
  const columns: ColumnDef<Audience>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconUsers className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-sm text-muted-foreground">{row.original.local}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "definition",
      header: "Definition",
      cell: ({ row }) => {
        const definition = row.getValue("definition") as string
        return (
          <div className="max-w-[200px] truncate text-sm">
            {definition || "No definition"}
          </div>
        )
      },
    },
    {
      accessorKey: "emailType",
      header: "Email Type",
      cell: ({ row }) => getEmailTypeBadge(row.getValue("emailType")),
    },
    {
      accessorKey: "countRecipients",
      header: "Recipients",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconMail className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">
            {formatNumber(row.getValue("countRecipients"))}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("active") as boolean
        return (
          <Badge variant={isActive ? "default" : "destructive"}
            className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const audience = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(audience)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(audience.id)}
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
        <div className="text-muted-foreground">Loading audiences...</div>
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
      {/* Loading overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Updating recipients count...</span>
          </div>
        </div>
      )}
      
      <div className="w-full space-y-4">
        {/* <div className="flex items-center justify-between">
          <Input
            placeholder="Search audiences..."
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="max-w-sm"
          /> */}
          <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshRecipients}
            disabled={isRefreshing || !data.length}
          >
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Audience
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
                    No audiences found.
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

      {/* Add Audience Modal */}
      <AddAudienceModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        onAudienceCreatedAction={handleAudienceAdded}
      />

      {/* Edit Audience Modal */}
      <EditAudienceModal
        isOpen={isEditModalOpen}
        onCloseAction={() => {
          setIsEditModalOpen(false)
          setSelectedAudienceId(null)
        }}
        onAudienceUpdatedAction={handleAudienceUpdated}
        audienceId={selectedAudienceId}
      />
    </>
  )
}