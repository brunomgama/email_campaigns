"use client"

import * as React from "react"
import { IconX } from "@tabler/icons-react"
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
import { templatesApi, type UpdateTemplateRequest } from "@/lib/templates-api"
import { audienceTypesApi, type AudienceType } from "@/lib/audience-types-api"

interface EditTemplateModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onTemplateUpdatedAction: () => void
  templateId: string | null
}

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

export function EditTemplateModal({ isOpen, onCloseAction, onTemplateUpdatedAction, templateId }: EditTemplateModalProps) {
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
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [audienceTypes, setAudienceTypes] = React.useState<AudienceType[]>([])
  const [loadingAudienceTypes, setLoadingAudienceTypes] = React.useState(false)

  // Fetch template data when modal opens
  React.useEffect(() => {
    if (isOpen && templateId) {
      const fetchTemplateData = async (id: string) => {
        try {
          setIsLoading(true)
          const template = await templatesApi.getOne(id)
          setFormData({
            name: template.name || "",
            local: template.local || "",
            audienceTypeId: template.audienceTypeId || "",
            emailType: template.emailType || "",
            header: template.header || "",
            footer: template.footer || "",
            unsubscribe: template.unsubscribe || "",
            status: template.status || "draft",
          })
        } catch (err) {
          console.error("Error fetching template:", err)
          toast.error("Failed to load template data")
          onCloseAction()
        } finally {
          setIsLoading(false)
        }
      }
    
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

      fetchTemplateData(templateId)
      fetchAudienceTypes()
    }
  }, [isOpen, templateId, onCloseAction])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        local: "",
        audienceTypeId: "",
        emailType: "",
        header: "",
        footer: "",
        unsubscribe: "",
        status: "draft",
      })
      setErrors({})
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [isOpen])

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseAction()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCloseAction])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // No field is mandatory since template can be updated with fields missing
    // But we can add basic validation for format if needed

    // setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !templateId) return

    setIsSubmitting(true)
    try {
      const requestData: UpdateTemplateRequest = {
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

      await templatesApi.update(templateId, requestData)
      toast.success("Template updated successfully!")
      onTemplateUpdatedAction()
      onCloseAction()
    } catch (err) {
      console.error("Error updating template:", err)
      // Extract meaningful error message from API response
      let errorMessage = "Failed to update template"
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onCloseAction}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Edit Template</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update the template details. All fields are optional.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseAction}
            className="rounded-full"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading template data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
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
                  <Select
                    value={formData.local}
                    onValueChange={(value) => handleInputChange('local', value)}
                  >
                    <SelectTrigger className={`w-full ${errors.local ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select local (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 French (FR)</SelectItem>
                      <SelectItem value="NL">🇳🇱 Dutch (NL)</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <SelectTrigger className={`w-full ${errors.staus ? "border-red-500" : ""}`}>
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

              {/* HTML Content with Preview */}
              <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <Label htmlFor="header">Header HTML</Label>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="space-y-2">
                      <Textarea
                        id="header"
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
                </div>

                {/* Footer */}
                <div className="space-y-2">
                  <Label htmlFor="footer">Footer HTML</Label>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="space-y-2">
                      <Textarea
                        id="footer"
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
                </div>

                {/* Unsubscribe */}
                <div className="space-y-2">
                  <Label htmlFor="unsubscribe">Unsubscribe HTML</Label>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="space-y-2">
                      <Textarea
                        id="unsubscribe"
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onCloseAction}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Updating..." : "Update Template"}
          </Button>
        </div>
      </div>
    </div>
  )
}