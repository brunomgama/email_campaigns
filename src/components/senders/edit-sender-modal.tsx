"use client"

import * as React from "react"
import { IconPlus, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sendersApi, type Sender } from "@/lib/senders-api"

interface EditSenderModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onSenderUpdatedAction: () => void
  senderId: string | null
}

interface SenderFormData {
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
}

const EMAIL_TYPES = ['campaign', 'automation', 'functional'] as const

export function EditSenderModal({ isOpen, onCloseAction, onSenderUpdatedAction, senderId }: EditSenderModalProps) {
  const [formData, setFormData] = React.useState<SenderFormData>({
    email: '',
    alias: [],
    emailType: [],
    active: true
  })
  const [currentAlias, setCurrentAlias] = React.useState('')
  const [currentEmailType, setCurrentEmailType] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Fetch sender data when modal opens
  React.useEffect(() => {
    if (isOpen && senderId) {
      fetchSenderData(senderId)
    }
  }, [isOpen, senderId])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        alias: [],
        emailType: [],
        active: true
      })
      setCurrentAlias('')
      setCurrentEmailType('')
      setErrors({})
    }
  }, [isOpen])

  const fetchSenderData = async (id: string) => {
    try {
      setIsLoading(true)
      const sender = await sendersApi.getOne(id)
      setFormData({
        email: sender.email,
        alias: sender.alias || [],
        emailType: sender.emailType || [],
        active: sender.active
      })
    } catch (err) {
      console.error("Error fetching sender:", err)
      toast.error("Failed to load sender data")
      onCloseAction()
    } finally {
      setIsLoading(false)
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.alias.length === 0) {
      newErrors.alias = 'At least one alias is required'
    }

    if (formData.emailType.length === 0) {
      newErrors.emailType = 'At least one email type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addAlias = () => {
    if (currentAlias.trim() && !formData.alias.includes(currentAlias.trim())) {
      setFormData(prev => ({
        ...prev,
        alias: [...prev.alias, currentAlias.trim()]
      }))
      setCurrentAlias('')
      if (errors.alias) {
        setErrors(prev => ({ ...prev, alias: '' }))
      }
    }
  }

  const removeAlias = (aliasToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      alias: prev.alias.filter(alias => alias !== aliasToRemove)
    }))
  }

  const addEmailType = () => {
    if (currentEmailType && !formData.emailType.includes(currentEmailType)) {
      setFormData(prev => ({
        ...prev,
        emailType: [...prev.emailType, currentEmailType]
      }))
      setCurrentEmailType('')
      if (errors.emailType) {
        setErrors(prev => ({ ...prev, emailType: '' }))
      }
    }
  }

  const removeEmailType = (typeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      emailType: prev.emailType.filter(type => type !== typeToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !senderId) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await sendersApi.update(senderId, {
        email: formData.email.trim(),
        alias: formData.alias,
        emailType: formData.emailType,
        active: formData.active,
        user: "Bruno"
      })

      toast.success("Sender updated successfully!")
      onSenderUpdatedAction()
      onCloseAction()
    } catch (err) {
      console.error("Error updating sender:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update sender")
    } finally {
      setIsSubmitting(false)
    }
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
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-background border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Edit Sender</h2>
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
          {isLoading ? (
            <div className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading sender data...</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }))
                    }
                  }}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Aliases Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aliases *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add alias"
                    value={currentAlias}
                    onChange={(e) => setCurrentAlias(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAlias()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addAlias}
                    size="icon"
                    variant="outline"
                  >
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.alias.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.alias.map((alias, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {alias}
                        <button
                          type="button"
                          onClick={() => removeAlias(alias)}
                          className="ml-1 hover:text-destructive"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.alias && (
                  <p className="text-sm text-destructive">{errors.alias}</p>
                )}
              </div>

              {/* Email Types Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Types *</Label>
                <div className="flex gap-2">
                  <Select value={currentEmailType} onValueChange={setCurrentEmailType}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={addEmailType}
                    size="icon"
                    variant="outline"
                    disabled={!currentEmailType}
                  >
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.emailType.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.emailType.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                        <button
                          type="button"
                          onClick={() => removeEmailType(type)}
                          className="ml-1 hover:text-destructive"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.emailType && (
                  <p className="text-sm text-destructive">{errors.emailType}</p>
                )}
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, active: value === "active" }))
                  }
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
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
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Sender"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}