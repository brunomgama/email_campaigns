"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
  IconCopy,
  IconSend,
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
import { AddCampaignModal } from "./add-campaign-modal"
import { EditCampaignModal } from "./edit-campaign-modal"
import { campaignsApi, type Campaign } from "@/lib/campaigns-api"

export function CampaignsTable() {
  const [data, setData] = React.useState<Campaign[]>([])
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
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null)

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

  // Fetch campaigns function using API service
  const fetchCampaigns = React.useCallback(async (lastKey = "") => {
    try {
      setLoading(true)
      
      const result = await campaignsApi.list({
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
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns")
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.pageIndex, searchTerm])

  React.useEffect(() => {
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchCampaigns(currentPageKey)
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, fetchCampaigns])

  // Handle when a campaign is added
  const handleCampaignAdded = () => {
    // Reset pagination and refetch first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys([""])
    setLastEvaluatedKey("")
    setHasNextPage(false)
    setHasPreviousPage(false)
    fetchCampaigns("")
  }

  // Handle edit campaign
  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id)
    setIsEditModalOpen(true)
  }

  // Handle delete campaign using API service
  const handleDelete = async (campaignId: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return
    }

    try {
      await campaignsApi.delete(campaignId)
      toast.success("Campaign deleted successfully!")
      handleCampaignAdded() // Refresh the table
    } catch (err) {
      console.error("Error deleting campaign:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete campaign")
    }
  }

  // Handle duplicate campaign
  const handleDuplicate = async (campaignId: string) => {
    try {
      await campaignsApi.duplicate(campaignId)
      toast.success("Campaign duplicated successfully!")
      handleCampaignAdded() // Refresh the table
    } catch (err) {
      console.error("Error duplicating campaign:", err)
      toast.error(err instanceof Error ? err.message : "Failed to duplicate campaign")
    }
  }

  // Handle send campaign
  const handleSend = (campaign: Campaign) => {
    const sendUrl = `/campaigns/send?id=${campaign.id}&name=${encodeURIComponent(campaign.name || 'Untitled')}`
    window.location.href = sendUrl
  }

  // Handle when a campaign is updated
  const handleCampaignUpdated = () => {
    // Refresh current page
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchCampaigns(currentPageKey)
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'planned':
        return 'default'
      case 'sent':
        return 'default'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Define columns inside component to access handlers
  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconSend className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.getValue("name") || "Untitled"}</div>
            <div className="text-sm text-muted-foreground">{row.original.local}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm">
          {row.getValue("subject") || "No subject"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        )
      },
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
      accessorKey: "modifyDate",
      header: "Modified",
      cell: ({ row }) => {
        const date = new Date(row.getValue("modifyDate"))
        return <div className="text-sm">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const campaign = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSend(campaign)}>
                <IconSend className="mr-2 h-4 w-4" />
                Send
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                <IconCopy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(campaign.id)}
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
        <div className="text-muted-foreground">Loading campaigns...</div>
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
        {/* <div className="flex items-center justify-between">
          <Input
            placeholder="Search campaigns..."
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="max-w-sm"
          /> */}
          <div className="flex justify-end">
          <Button onClick={() => setIsModalOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Campaign
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
                    No campaigns found.
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

      {/* Add Campaign Modal */}
      <AddCampaignModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        onCampaignAddedAction={handleCampaignAdded}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        isOpen={isEditModalOpen}
        onCloseAction={() => {
          setIsEditModalOpen(false)
          setSelectedCampaignId(null)
        }}
        onCampaignUpdatedAction={handleCampaignUpdated}
        campaignId={selectedCampaignId}
      />
    </>
  )
}