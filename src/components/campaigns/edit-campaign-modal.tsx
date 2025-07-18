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
import { campaignsApi, type UpdateCampaignRequest } from "@/lib/campaigns-api"
import { audienceApi, type Audience } from "@/lib/audience-api"
import { sendersApi, type Sender } from "@/lib/senders-api"
import { templatesApi, type Template } from "@/lib/templates-api"

interface EditCampaignModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onCampaignUpdatedAction: () => void
  campaignId: string | null
}

interface FormData {
  name: string
  local: string
  audienceId: string
  senderId: string
  senderAlias: string
  subject: string
  content: string
  templateId: string
  status: 'draft' | 'planned' | 'archived' | 'sent'
}

interface FormErrors {
  name?: string
  local?: string
  audienceId?: string
  senderId?: string
  senderAlias?: string
  subject?: string
  content?: string
  templateId?: string
  status?: string
}

export function EditCampaignModal({ isOpen, onCloseAction, onCampaignUpdatedAction, campaignId }: EditCampaignModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    local: "",
    audienceId: "",
    senderId: "",
    senderAlias: "",
    subject: "",
    content: "",
    templateId: "",
    status: "draft",
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Related data states
  const [audiences, setAudiences] = React.useState<Audience[]>([])
  const [senders, setSenders] = React.useState<Sender[]>([])
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loadingRelatedData, setLoadingRelatedData] = React.useState(false)

  // Load campaign data when modal opens and campaignId is provided
  React.useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaign()
      fetchRelatedData()
    }
  }, [isOpen, campaignId])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        local: "",
        audienceId: "",
        senderId: "",
        senderAlias: "",
        subject: "",
        content: "",
        templateId: "",
        status: "draft",
      })
      setErrors({})
      setIsSubmitting(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const fetchCampaign = async () => {
    if (!campaignId) return
    
    try {
      setIsLoading(true)
      const campaign = await campaignsApi.getOne(campaignId)
      setFormData({
        name: campaign.name,
        local: campaign.local,
        audienceId: campaign.audienceId,
        senderId: campaign.senderId,
        senderAlias: campaign.senderAlias,
        subject: campaign.subject,
        content: campaign.content,
        templateId: campaign.templateId,
        status: campaign.status,
      })
    } catch (err) {
      console.error("Error fetching campaign:", err)
      toast.error("Failed to load campaign data")
      onCloseAction()
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelatedData = async () => {
    try {
      setLoadingRelatedData(true)
      
      const [audiencesResponse, sendersResponse, templatesResponse] = await Promise.all([
        audienceApi.list({ limit: 100 }),
        sendersApi.list({ limit: 100 }),
        templatesApi.list({ limit: 100 })
      ])
      
      setAudiences(audiencesResponse.results || [])
      setSenders(sendersResponse.results || [])
      setTemplates(templatesResponse.results || [])
    } catch (err) {
      console.error("Error fetching related data:", err)
      toast.error("Failed to load related data")
    } finally {
      setLoadingRelatedData(false)
    }
  }

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

    // No field is mandatory since campaign can be updated with fields missing
    // But we can add basic validation for format if needed

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!campaignId) return

    setIsSubmitting(true)
    try {
      const requestData: UpdateCampaignRequest = {
        user: "Bruno", // Replace with actual user
      }

      // Only include fields that have values
      if (formData.name.trim()) requestData.name = formData.name.trim()
      if (formData.local.trim()) requestData.local = formData.local.trim()
      if (formData.audienceId) requestData.audienceId = formData.audienceId
      if (formData.senderId) requestData.senderId = formData.senderId
      if (formData.senderAlias.trim()) requestData.senderAlias = formData.senderAlias.trim()
      if (formData.subject.trim()) requestData.subject = formData.subject.trim()
      if (formData.content.trim()) requestData.content = formData.content.trim()
      if (formData.templateId) requestData.templateId = formData.templateId
      if (formData.status) requestData.status = formData.status

      await campaignsApi.update(campaignId, requestData)
      toast.success("Campaign updated successfully!")
      onCampaignUpdatedAction()
      onCloseAction()
    } catch (err) {
      console.error("Error updating campaign:", err)
      // Extract meaningful error message from API response
      let errorMessage = "Failed to update campaign"
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
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Edit Campaign</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update campaign information. All fields are optional.
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading campaign data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter campaign name (optional)"
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
                  <Label htmlFor="audienceId">Audience</Label>
                  <Select
                    value={formData.audienceId}
                    onValueChange={(value) => handleInputChange('audienceId', value)}
                    disabled={loadingRelatedData}
                  >
                    <SelectTrigger className={`w-full ${errors.audienceId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select audience (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map((audience) => (
                        <SelectItem key={audience.id} value={audience.id}>
                          {audience.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.audienceId && <p className="text-sm text-red-500">{errors.audienceId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender</Label>
                  <Select
                    value={formData.senderId}
                    onValueChange={(value) => handleInputChange('senderId', value)}
                    disabled={loadingRelatedData}
                  >
                    <SelectTrigger className={`w-full ${errors.senderId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select sender (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {senders.map((sender) => (
                        <SelectItem key={sender.id} value={sender.id}>
                          {sender.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.senderId && <p className="text-sm text-red-500">{errors.senderId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderAlias">Sender Alias</Label>
                  <Input
                    id="senderAlias"
                    value={formData.senderAlias}
                    onChange={(e) => handleInputChange('senderAlias', e.target.value)}
                    placeholder="Enter sender alias (optional)"
                    className={errors.senderAlias ? "border-red-500" : ""}
                  />
                  {errors.senderAlias && <p className="text-sm text-red-500">{errors.senderAlias}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateId">Template</Label>
                  <Select
                    value={formData.templateId}
                    onValueChange={(value) => handleInputChange('templateId', value)}
                    disabled={loadingRelatedData}
                  >
                    <SelectTrigger className={`w-full ${errors.templateId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.templateId && <p className="text-sm text-red-500">{errors.templateId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as 'draft' | 'planned' | 'archived' | 'sent')}
                  >
                    <SelectTrigger className={`w-full ${errors.status ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter email subject (optional)"
                    className={errors.subject ? "border-red-500" : ""}
                  />
                  {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                </div>
              </div>

              {/* Content with Preview */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="space-y-2">
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Enter campaign content HTML (optional)"
                        className={`min-h-[200px] font-mono text-sm ${errors.content ? "border-red-500" : ""}`}
                        rows={10}
                      />
                      {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-2">
                      <div 
                        className="min-h-[200px] p-3 border rounded-md bg-white"
                        dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-gray-500">No content</p>' }}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/50">
          <Button
            variant="outline"
            onClick={onCloseAction}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Updating..." : "Update Campaign"}
          </Button>
        </div>
      </div>
    </div>
  )
}