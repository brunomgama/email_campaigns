"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconTrash,
  IconCopy,
  IconArchive,
  IconTemplate,
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
import { AddTemplateModal } from "./add-template-modal"
import { EditTemplateModal } from "./edit-template-modal"
import { templatesApi, type Template } from "@/lib/templates-api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TemplatesTable() {
  const [data, setData] = React.useState<Template[]>([])
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
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null)

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

  // Fetch templates function using API service
  const fetchTemplates = React.useCallback(async (lastKey = "") => {
    try {
      setLoading(true)
      
      const result = await templatesApi.list({
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
      setError(err instanceof Error ? err.message : "Failed to fetch templates")
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.pageIndex, searchTerm])

  React.useEffect(() => {
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchTemplates(currentPageKey)
  }, [pagination.pageIndex, pagination.pageSize, searchTerm, fetchTemplates])

  // Handle when a template is added
  const handleTemplateAdded = () => {
    // Reset pagination and refetch first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    setPageKeys([""])
    setLastEvaluatedKey("")
    setHasNextPage(false)
    setHasPreviousPage(false)
    fetchTemplates("")
  }

  // Handle edit template
  const handleEdit = (template: Template) => {
    setSelectedTemplateId(template.id)
    setIsEditModalOpen(true)
  }

  // Handle delete template using API service
  const handleDelete = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      await templatesApi.delete(templateId)
      toast.success("Template deleted successfully!")
      handleTemplateAdded() // Refresh the table
    } catch (err) {
      console.error("Error deleting template:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete template")
    }
  }

  // Handle duplicate template
  const handleDuplicate = async (templateId: string) => {
    try {
      await templatesApi.duplicate(templateId)
      toast.success("Template duplicated successfully!")
      handleTemplateAdded() // Refresh the table
    } catch (err) {
      console.error("Error duplicating template:", err)
      toast.error(err instanceof Error ? err.message : "Failed to duplicate template")
    }
  }

  // Handle archive template
  const handleArchive = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to archive this template?")) {
      return
    }

    try {
      await templatesApi.archive(templateId, { user: "Bruno" })
      toast.success("Template archived successfully!")
      handleTemplateAdded() // Refresh the table
    } catch (err) {
      console.error("Error archiving template:", err)
      toast.error(err instanceof Error ? err.message : "Failed to archive template")
    }
  }

  // Handle when a template is updated
  const handleTemplateUpdated = () => {
    // Refresh current page
    const currentPageKey = pageKeys[pagination.pageIndex] || ""
    fetchTemplates(currentPageKey)
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

  // Get flag emoji for local
  const getLocalFlag = (local: string) => {
    switch (local.toUpperCase()) {
      case 'FR':
        return '🇫🇷'
      case 'NL':
        return '🇳🇱'
      default:
        return local
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-200'
      case 'draft':
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
      case 'archived':
        return 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
    }
  }

  const getEmailTypeBadgeVariant = (emailType: string) => {
    const normalizedType = emailType.toLowerCase()
    switch (normalizedType) {
      case 'campaign':
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
      case 'functional':
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      case 'automation':
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
    }
  }

  // Define columns inside component to access handlers
  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconTemplate className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{row.getValue("name") || "Untitled"}</div>
        </div>
      ),
    },
    {
      accessorKey: "local",
      header: "Local",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{getLocalFlag(row.getValue("local"))}</span>
          <span className="text-sm font-medium">{row.getValue("local") || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "emailType",
      header: "Email Type",
      cell: ({ row }) => {
        const emailType = row.getValue("emailType") as string
        return emailType ? (
          <Badge variant="outline" className={`text-xs ${getEmailTypeBadgeVariant(emailType)}`}>
            {emailType.charAt(0).toUpperCase() + emailType.slice(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="default" className={getStatusBadgeVariant(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const template = row.original

        return (
          <div className="flex items-center gap-2 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="h-8 px-2 text-black hover:text-white hover:bg-black"
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit template</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template.id)}
                    className="h-8 px-2 text-black hover:text-white hover:bg-black"
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate template</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(template.id)}
                    className="h-8 px-2 text-black hover:text-white hover:bg-black"
                  >
                    <IconArchive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive template</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="h-8 px-2 text-destructive hover:text-white hover:bg-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete template</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
        <div className="text-muted-foreground">Loading templates...</div>
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
        <div className="flex justify-end">
          <Button onClick={() => setIsModalOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Template
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
                    No templates found.
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

      {/* Add Template Modal */}
      <AddTemplateModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        onTemplateAddedAction={handleTemplateAdded}
      />

      {/* Edit Template Modal */}
      <EditTemplateModal
        isOpen={isEditModalOpen}
        onCloseAction={() => {
          setIsEditModalOpen(false)
          setSelectedTemplateId(null)
        }}
        onTemplateUpdatedAction={handleTemplateUpdated}
        templateId={selectedTemplateId}
      />
    </>
  )
}