"use client"

import * as React from "react"
import { toast } from "sonner"
import Editor from "@monaco-editor/react"
import { IconX } from "@tabler/icons-react"

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
import { audienceApi, type CreateAudienceRequest } from "@/lib/audience-api"
import { audienceTypesApi, type AudienceType } from "@/lib/audience-types-api"

interface AddAudienceModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onAudienceCreatedAction: () => void
}

interface FormData {
  name: string
  local: string
  definition: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional' | ''
  sql: string
  active: boolean
}

interface FormErrors {
  name?: string
  local?: string
  definition?: string
  audienceTypeId?: string
  emailType?: string
  sql?: string
}

export function AddAudienceModal({
  isOpen,
  onCloseAction,
  onAudienceCreatedAction,
}: AddAudienceModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    local: "",
    definition: "",
    audienceTypeId: "",
    emailType: "",
    sql: "",
    active: true,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [audienceTypes, setAudienceTypes] = React.useState<AudienceType[]>([])
  const [loadingAudienceTypes, setLoadingAudienceTypes] = React.useState(false)

  // Load audience types when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchAudienceTypes()
    }
  }, [isOpen])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        local: "",
        definition: "",
        audienceTypeId: "",
        emailType: "",
        sql: "",
        active: true,
      })
      setErrors({})
      setIsSubmitting(false)
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.local.trim()) {
      newErrors.local = "Local is required"
    }

    if (!formData.audienceTypeId) {
      newErrors.audienceTypeId = "Audience type is required"
    }

    if (!formData.emailType) {
      newErrors.emailType = "Email type is required"
    }

    if (!formData.sql.trim()) {
      newErrors.sql = "SQL is required"
    }

    // Definition character limit
    if (formData.definition && formData.definition.length > 200) {
      newErrors.definition = "Definition must be 200 characters or less"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const requestData: CreateAudienceRequest = {
        name: formData.name.trim(),
        local: formData.local.trim(),
        definition: formData.definition.trim() || undefined,
        audienceTypeId: formData.audienceTypeId,
        emailType: formData.emailType as 'campaign' | 'automation' | 'functional',
        sql: formData.sql.trim(),
        active: formData.active,
        user: "Bruno", // Replace with actual user
      }

      await audienceApi.create(requestData)
      toast.success("Audience created successfully!")
      onAudienceCreatedAction()
      onCloseAction()
    } catch (err) {
      console.error("Error creating audience:", err)
      
      // Extract meaningful error message from API response
      let errorMessage = "Failed to create audience"
      
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

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSqlChange = (value: string | undefined) => {
    handleInputChange('sql', value || '')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCloseAction}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="bg-background border rounded-lg shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Add New Audience</h2>
              <p className="text-sm text-muted-foreground">Create a new audience by filling out the information below.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseAction}
              className="text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter audience name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label htmlFor="local">
                  Local <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.local}
                  onValueChange={(value) => handleInputChange('local', value)}
                >
                  <SelectTrigger className={`w-full ${errors.local ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">French (FR)</SelectItem>
                    <SelectItem value="NL">Dutch (NL)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.local && <p className="text-sm text-red-500">{errors.local}</p>}
              </div>

              {/* Definition */}
              <div className="space-y-2">
                <Label htmlFor="definition">
                  Definition
                  <span className="text-sm text-muted-foreground ml-2">
                    ({formData.definition.length}/200)
                  </span>
                </Label>
                <Textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => handleInputChange('definition', e.target.value)}
                  placeholder="Enter audience definition (optional)"
                  className={errors.definition ? "border-red-500" : ""}
                  rows={3}
                  maxLength={200}
                />
                {errors.definition && <p className="text-sm text-red-500">{errors.definition}</p>}
              </div>

              {/* Audience Type */}
              <div className="space-y-2">
                <Label htmlFor="audienceTypeId">
                  Audience Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.audienceTypeId}
                  onValueChange={(value) => handleInputChange('audienceTypeId', value)}
                >
                  <SelectTrigger className={`w-full ${errors.audienceTypeId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select audience type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingAudienceTypes ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : audienceTypes.length === 0 ? (
                      <SelectItem value="no-types" disabled>No audience types available</SelectItem>
                    ) : (
                      audienceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.audienceTypeId && <p className="text-sm text-red-500">{errors.audienceTypeId}</p>}
              </div>

              {/* Email Type */}
              <div className="space-y-2">
                <Label htmlFor="emailType">
                  Email Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.emailType}
                  onValueChange={(value) => handleInputChange('emailType', value)}
                >
                  <SelectTrigger className={`w-full ${errors.emailType ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select email type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="functional">Functional</SelectItem>
                  </SelectContent>
                </Select>
                {errors.emailType && <p className="text-sm text-red-500">{errors.emailType}</p>}
              </div>

              {/* SQL */}
              <div className="space-y-2">
                <Label htmlFor="sql">
                  SQL Query <span className="text-red-500">*</span>
                </Label>
                <div className={`border rounded-md ${errors.sql ? "border-red-500" : "border-input"}`}>
                  <Editor
                    height="200px"
                    defaultLanguage="sql"
                    value={formData.sql}
                    onChange={handleSqlChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                      },
                      automaticLayout: true,
                    }}
                    theme="vs-dark"
                  />
                </div>
                {errors.sql && <p className="text-sm text-red-500">{errors.sql}</p>}
              </div>

              {/* Active */}
              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  value={formData.active ? "active" : "inactive"}
                  onValueChange={(value) => handleInputChange('active', value === "active")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseAction}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Audience"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}