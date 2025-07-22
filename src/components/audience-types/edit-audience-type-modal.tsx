"use client"

import * as React from "react"
import { IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { audienceTypesApi } from "@/lib/audience-types-api"

interface EditAudienceTypeModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onAudienceTypeUpdatedAction: () => void
  audienceTypeId: string | null
}

interface AudienceTypeFormData {
  name: string
}

export function EditAudienceTypeModal({ isOpen, onCloseAction, onAudienceTypeUpdatedAction, audienceTypeId }: EditAudienceTypeModalProps) {
  const [formData, setFormData] = React.useState<AudienceTypeFormData>({
    name: ''
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Fetch audience type data when modal opens
  React.useEffect(() => {
    if (isOpen && audienceTypeId) {
      const fetchAudienceTypeData = async (id: string) => {
        try {
          setIsLoading(true)
          const audienceType = await audienceTypesApi.getOne(id)
          setFormData({
            name: audienceType.name
          })
        } catch (err) {
          console.error("Error fetching audience type:", err)
          toast.error("Failed to load audience type data")
          onCloseAction()
        } finally {
          setIsLoading(false)
        }
      }
      fetchAudienceTypeData(audienceTypeId)
    }
  }, [isOpen, audienceTypeId, onCloseAction])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: ''
      })
      setErrors({})
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !audienceTypeId) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await audienceTypesApi.update(audienceTypeId, {
        name: formData.name.trim(),
        user: "Bruno"
      })

      toast.success("Audience type updated successfully!")
      onAudienceTypeUpdatedAction()
      onCloseAction()
    } catch (err) {
      console.error("Error updating audience type:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update audience type")
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
            <h2 className="text-lg font-semibold">Edit Audience Type</h2>
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
                <div className="text-muted-foreground">Loading audience type data...</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter audience type name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    // Clear error when user starts typing
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
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
                  {isSubmitting ? "Updating..." : "Update Audience Type"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}