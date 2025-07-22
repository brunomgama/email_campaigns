"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Mail, 
  Users, 
  FileText, 
  Send,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { schedulerApi } from "@/lib/scheduler-api"
import { audienceApi } from "@/lib/audience-api"
import { sendersApi } from "@/lib/senders-api"
import { templatesApi } from "@/lib/templates-api"

interface CalendarEvent {
  schedule: {
    id: string
    campaignId: string
    emailReceiver: string[]
    scheduled_time: string
    variables: Record<string, string>
  }
  campaign?: {
    id: string
    name: string
    local: string
    audienceId: string
    senderId: string
    senderAlias: string
    subject: string
    content: string
    templateId: string
    status: string
    createDate: string
    modifyDate: string
  }
  date: Date
}

interface ScheduleEventModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
}

interface Audience {
  id: string
  name: string
  local: string
  definition?: string
  audienceTypeId: string
  emailType: 'campaign' | 'automation' | 'functional'
  sql: string
  countRecipients: number
  active: boolean
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

interface Sender {
  id: string
  email: string
  alias: string[]
  emailType: string[]
  active: boolean
  createDate: string
  createUser: string
  modifyDate: string
  modifyUser: string
}

interface Template {
  id: string
  name: string
  local: string
  audienceTypeId: string
  emailType: string
  header: string
  footer: string
  unsubscribe?: string
  status: string
}

export function ScheduleEventModal({ event, isOpen, onClose }: ScheduleEventModalProps) {
  const [audience, setAudience] = useState<Audience | null>(null)
  const [sender, setSender] = useState<Sender | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)

  // Utility functions for colors and flags
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
      case 'scheduled':
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft':
      case 'paused':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'failed':
      case 'error':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getEmailTypeColor = (emailType: string) => {
    switch (emailType.toLowerCase()) {
      case 'campaign':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'automation':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'functional':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'transactional':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'FR': '🇫🇷',
      'NL': '🇳🇱'
    }
    return flags[countryCode.toUpperCase()] || '🌍'
  }

  // Fetch related data when event changes
  useEffect(() => {
    if (event?.campaign && isOpen) {
      const fetchRelatedData = async () => {
        if (!event?.campaign) return
    
        try {
          setLoading(true)
          
          const [audienceResponse, senderResponse, templateResponse] = await Promise.all([
            event.campaign.audienceId ? audienceApi.getOne(event.campaign.audienceId).catch(() => null) : null,
            event.campaign.senderId ? sendersApi.getOne(event.campaign.senderId).catch(() => null) : null,
            event.campaign.templateId ? templatesApi.getOne(event.campaign.templateId).catch(() => null) : null,
          ])
          
          setAudience(audienceResponse)
          setSender(senderResponse)
          setTemplate(templateResponse)
        } catch (err) {
          console.error("Error fetching related data:", err)
          toast.error("Failed to load complete event details")
        } finally {
          setLoading(false)
        }
      }
      
      fetchRelatedData()
    }
  }, [event, isOpen])

  const handleDeleteSchedule = async () => {
    if (!event?.schedule.id) return

    if (!window.confirm("Are you sure you want to delete this scheduled campaign?")) {
      return
    }

    try {
      await schedulerApi.delete(event.schedule.id)
      toast.success("Scheduled campaign deleted successfully!")
      onClose()
    } catch (err) {
      console.error("Error deleting schedule:", err)
      toast.error("Failed to delete scheduled campaign")
    }
  }

  if (!event) return null

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      time: date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        timeZoneName: "short"
      })
    }
  }

  const { date, time } = formatDateTime(event.schedule.scheduled_time)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Campaign Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                  <p className="text-lg">{date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Time</p>
                  <p className="text-lg">{time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recipients</p>
                  <p className="text-lg">
                    {event.schedule.emailReceiver ? 
                      `${event.schedule.emailReceiver.length} email addresses` : 
                      <span className="text-red-600">No recipients data</span>
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Schedule ID</p>
                  <p className="font-mono text-sm">{event.schedule.id}</p>
                </div>
              </div>

              {/* Variables */}
              {Object.keys(event.schedule.variables || {}).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Variables</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(event.schedule.variables).map(([key, value]) => (
                      <div key={key} className="bg-muted p-2 rounded">
                        <span className="font-mono text-sm">{key}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteSchedule}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          {event.campaign && (
            <Tabs defaultValue="campaign" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="campaign">Campaign</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="sender">Sender</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="preview">Email Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="campaign" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Campaign Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Campaign Name</p>
                        <p className="text-lg font-semibold">{event.campaign.name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subject</p>
                          <p>{event.campaign.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge className={getStatusColor(event.campaign.status)}>{event.campaign.status}</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Sender Alias</p>
                        <p>{event.campaign.senderAlias}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="flex items-center gap-2">
                          <span>{getCountryFlag(event.campaign.local)}</span>
                          {event.campaign.local}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audience" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Audience Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading audience details...</p>
                    ) : audience ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Audience Name</p>
                          <p className="text-lg font-semibold">{audience.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p>{audience.definition}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                          <p className="text-2xl font-bold">{audience.countRecipients.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email Type</p>
                          <Badge className={getEmailTypeColor(audience.emailType)}>{audience.emailType}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No audience information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sender" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Sender Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading sender details...</p>
                    ) : sender ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Sender Name</p>
                          <p className="text-lg font-semibold">{sender.email}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Alias</p>
                          <p>{sender.alias.join(", ")}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email Type</p>
                          <div className="flex flex-wrap gap-1">
                            {sender.emailType.map((type, index) => (
                              <Badge key={index} className={getEmailTypeColor(type)}>{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No sender information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="template" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Template Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading template details...</p>
                    ) : template ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Template Name</p>
                          <p className="text-lg font-semibold">{template.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email Type</p>
                          <Badge className={getEmailTypeColor(template.emailType)}>{template.emailType}</Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Location</p>
                          <p className="flex items-center gap-2">
                            <span>{getCountryFlag(template.local)}</span>
                            {template.local}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge className={getStatusColor(template.status)}>{template.status}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No template information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Full Email Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading email preview...</p>
                    ) : (event.campaign || template) ? (
                      <div className="space-y-4">
                        <div className="bg-white border rounded-lg p-6 max-h-[70vh] overflow-y-auto">
                          {/* Email Header */}
                          {template?.header && (
                            <div className="mb-6 pb-4 border-b">
                              <p className="text-xs text-muted-foreground mb-2">HEADER</p>
                              <div 
                                dangerouslySetInnerHTML={{ __html: template.header }}
                              />
                            </div>
                          )}
                          
                          {/* Email Content */}
                          <div className="mb-6">
                            <p className="text-xs text-muted-foreground mb-2">CONTENT</p>
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: event.campaign?.content || '<p class="text-gray-500">No content available</p>' 
                              }}
                            />
                          </div>
                          
                          {/* Email Footer */}
                          {template?.footer && (
                            <div className="mb-6 pt-4 border-t">
                              <p className="text-xs text-muted-foreground mb-2">FOOTER</p>
                              <div 
                                dangerouslySetInnerHTML={{ __html: template.footer }}
                              />
                            </div>
                          )}
                          
                          {/* Unsubscribe */}
                          {template?.unsubscribe && (
                            <div className="pt-4 border-t border-dashed">
                              <p className="text-xs text-muted-foreground mb-2">UNSUBSCRIBE</p>
                              <div 
                                className="text-xs text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: template.unsubscribe }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          This preview shows how the complete email will appear to recipients, including header, content, footer, and unsubscribe sections.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No email content available for preview</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Email Receivers List */}
          {event.schedule.emailReceiver && event.schedule.emailReceiver.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Recipients ({event.schedule.emailReceiver.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {event.schedule.emailReceiver.map((email, index) => (
                      <div key={index} className="font-mono text-sm bg-muted p-2 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : event.schedule.emailReceiver === null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">No recipients data available</p>
                  <p className="text-sm text-muted-foreground mt-2">This record appears to be malformed</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}