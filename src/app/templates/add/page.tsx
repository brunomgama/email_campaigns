"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { templatesApi, type CreateTemplateRequest } from "@/lib/templates-api"
import { audienceTypesApi, type AudienceType } from "@/lib/audience-types-api"

interface FormData {
  name: string
  local: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional' | ''
  header: string
  footer: string
  unsubscribe: string
  status: 'draft' | 'published' | 'archived'
}

interface FormErrors {
  name?: string
  local?: string
  audienceTypeId?: string
  emailType?: string
  header?: string
  footer?: string
  unsubscribe?: string
  status?: string
}

function AddTemplateContent() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    local: "",
    audienceTypeId: "",
    emailType: "",
    header: "",
    footer: "",
    unsubscribe: "",
    status: "draft",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [audienceTypes, setAudienceTypes] = React.useState<AudienceType[]>([])
  const [loadingAudienceTypes, setLoadingAudienceTypes] = React.useState(false)

  // Fetch audience types on mount
  React.useEffect(() => {
    fetchAudienceTypes()
  }, [])

  const fetchAudienceTypes = async () => {
    try {
      setLoadingAudienceTypes(true)
      const response = await audienceTypesApi.list({ limit: 100 })
      setAudienceTypes(response.results || [])
    } catch (err) {
      console.error("Error fetching audience types:", err)
      toast.error("Failed to load audience types")
    } finally {
      setLoadingAudienceTypes(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    // No field is mandatory since template can be created with fields missing
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const requestData: CreateTemplateRequest = {
        user: "Bruno", // Replace with actual user
      }

      // Only include fields that have values
      if (formData.name.trim()) requestData.name = formData.name.trim()
      if (formData.local.trim()) requestData.local = formData.local.trim()
      if (formData.audienceTypeId) requestData.audienceTypeId = formData.audienceTypeId
      if (formData.emailType) requestData.emailType = formData.emailType as 'campaign' | 'automation' | 'functional'
      if (formData.header.trim()) requestData.header = formData.header.trim()
      if (formData.footer.trim()) requestData.footer = formData.footer.trim()
      if (formData.unsubscribe.trim()) requestData.unsubscribe = formData.unsubscribe.trim()
      if (formData.status) requestData.status = formData.status

      await templatesApi.create(requestData)
      toast.success("Template created successfully!")
      router.push('/templates')
    } catch (err) {
      console.error("Error creating template:", err)
      // Extract meaningful error message from API response
      let errorMessage = "Failed to create template"
      if (err instanceof Error) {
        const fullMessage = err.message
        // Check if it's an HTTP error with a message format
        if (fullMessage.includes("HTTP error! status:") && fullMessage.includes("message:")) {
          // Extract just the message part after "message: "
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
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push('/templates')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Template</h1>
          <p className="text-gray-600">
            Create a new email template. All fields are optional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter template name (optional)"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={formData.local}
                    onValueChange={(value) => handleInputChange('local', value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.local ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select local (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 French (FR)</SelectItem>
                      <SelectItem value="NL">🇳🇱 Dutch (NL)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Visual Local Indicator */}
                  <div className="flex items-center">
                    {formData.local && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                        <span className="text-lg">
                          {formData.local === 'FR' ? '🇫🇷' : formData.local === 'NL' ? '🇳🇱' : ''}
                        </span>
                        <span className="text-sm font-medium text-blue-700">
                          {formData.local === 'FR' ? 'French' : formData.local === 'NL' ? 'Dutch' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {errors.local && <p className="text-sm text-red-500">{errors.local}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="audienceTypeId">Audience Type</Label>
                <Select
                  value={formData.audienceTypeId}
                  onValueChange={(value) => handleInputChange('audienceTypeId', value)}
                  disabled={loadingAudienceTypes}
                >
                  <SelectTrigger className={`w-full ${errors.audienceTypeId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select audience type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.audienceTypeId && <p className="text-sm text-red-500">{errors.audienceTypeId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailType">Email Type</Label>
                <Select
                  value={formData.emailType}
                  onValueChange={(value) => handleInputChange('emailType', value)}
                >
                  <SelectTrigger className={`w-full ${errors.emailType ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select email type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="functional">Functional</SelectItem>
                  </SelectContent>
                </Select>
                {errors.emailType && <p className="text-sm text-red-500">{errors.emailType}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as 'draft' | 'published' | 'archived')}
                >
                  <SelectTrigger className={`w-full ${errors.status ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HTML Content Cards */}
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle>Header HTML</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="space-y-2">
                  <Textarea
                    value={formData.header}
                    onChange={(e) => handleInputChange('header', e.target.value)}
                    placeholder="Enter header HTML (optional)"
                    className={`min-h-[120px] font-mono text-sm ${errors.header ? "border-red-500" : ""}`}
                    rows={6}
                  />
                  {errors.header && <p className="text-sm text-red-500">{errors.header}</p>}
                </TabsContent>
                <TabsContent value="preview" className="space-y-2">
                  <div 
                    className="min-h-[120px] p-3 border rounded-md bg-white"
                    dangerouslySetInnerHTML={{ __html: formData.header || '<p class="text-gray-500">No header content</p>' }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card>
            <CardHeader>
              <CardTitle>Footer HTML</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="space-y-2">
                  <Textarea
                    value={formData.footer}
                    onChange={(e) => handleInputChange('footer', e.target.value)}
                    placeholder="Enter footer HTML (optional)"
                    className={`min-h-[120px] font-mono text-sm ${errors.footer ? "border-red-500" : ""}`}
                    rows={6}
                  />
                  {errors.footer && <p className="text-sm text-red-500">{errors.footer}</p>}
                </TabsContent>
                <TabsContent value="preview" className="space-y-2">
                  <div 
                    className="min-h-[120px] p-3 border rounded-md bg-white"
                    dangerouslySetInnerHTML={{ __html: formData.footer || '<p class="text-gray-500">No footer content</p>' }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Unsubscribe */}
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribe HTML</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="space-y-2">
                  <Textarea
                    value={formData.unsubscribe}
                    onChange={(e) => handleInputChange('unsubscribe', e.target.value)}
                    placeholder="Enter unsubscribe HTML (optional)"
                    className={`min-h-[80px] font-mono text-sm ${errors.unsubscribe ? "border-red-500" : ""}`}
                    rows={4}
                  />
                  {errors.unsubscribe && <p className="text-sm text-red-500">{errors.unsubscribe}</p>}
                </TabsContent>
                <TabsContent value="preview" className="space-y-2">
                  <div 
                    className="min-h-[80px] p-3 border rounded-md bg-white"
                    dangerouslySetInnerHTML={{ __html: formData.unsubscribe || '<p class="text-gray-500">No unsubscribe content</p>' }}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function AddTemplatePage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <AddTemplateContent />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}