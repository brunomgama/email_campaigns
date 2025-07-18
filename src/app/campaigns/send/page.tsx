"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { IconArrowLeft, IconMail, IconPlus, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { campaignsApi, type Campaign, type SendEmailRequest } from "@/lib/campaigns-api"
import { templatesApi, type Template } from "@/lib/templates-api"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

function SendPageContent() {
  const searchParams = useSearchParams()
  const urlCampaignId = searchParams.get('id')
  const urlCampaignName = searchParams.get('name')

  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string>(urlCampaignId || "")
  const [campaign, setCampaign] = React.useState<Campaign | null>(null)
  const [template, setTemplate] = React.useState<Template | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingCampaigns, setLoadingCampaigns] = React.useState(true)
  const [sending, setSending] = React.useState(false)

  // Form state
  const [emailReceivers, setEmailReceivers] = React.useState<string>("")
  const [variables, setVariables] = React.useState<Array<{ key: string; value: string }>>([
    { key: "unsubscribe_label", value: "Unsubscribe" }
  ])

  // Load campaigns list for dropdown
  React.useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoadingCampaigns(true)
        const result = await campaignsApi.list({ limit: 100 }) // Get all campaigns
        setCampaigns(result.results)
      } catch (err) {
        console.error("Error loading campaigns:", err)
        toast.error("Failed to load campaigns list")
      } finally {
        setLoadingCampaigns(false)
      }
    }

    loadCampaigns()
  }, [])

  // Load campaign and template data when campaign is selected
  React.useEffect(() => {
    if (!selectedCampaignId) {
      setCampaign(null)
      setTemplate(null)
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const campaignData = await campaignsApi.getOne(selectedCampaignId)
        setCampaign(campaignData)

        if (campaignData.templateId) {
          const templateData = await templatesApi.getOne(campaignData.templateId)
          setTemplate(templateData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        toast.error("Failed to load campaign or template data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCampaignId])

  // Handle campaign selection
  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    // Clear form when changing campaigns
    setEmailReceivers("")
    setVariables([{ key: "unsubscribe_label", value: "Unsubscribe" }])
  }

  // Add new variable row
  const addVariable = () => {
    setVariables([...variables, { key: "", value: "" }])
  }

  // Remove variable row
  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  // Update variable
  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...variables]
    updated[index][field] = value
    setVariables(updated)
  }

  // Send email
  const handleSendEmail = async () => {
    if (!campaign) return

    // Validate email receivers
    const emails = emailReceivers
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emails.length === 0) {
      toast.error("Please enter at least one email address")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
      return
    }

    try {
      setSending(true)

      // Build variables object
      const variablesObj = variables.reduce((acc, { key, value }) => {
        if (key.trim()) {
          acc[key.trim()] = value
        }
        return acc
      }, {} as Record<string, string>)

      const sendRequest: SendEmailRequest = {
        emailId: campaign.id,
        emailReceiver: emails,
        variables: Object.keys(variablesObj).length > 0 ? variablesObj : undefined
      }

      await campaignsApi.sendEmail(sendRequest)
      toast.success(`Email sent successfully to ${emails.length} recipient(s)`)

      // Clear form
      setEmailReceivers("")
      setVariables([{ key: "unsubscribe_label", value: "Unsubscribe" }])
    } catch (err) {
      console.error("Error sending email:", err)
      toast.error(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  // Generate full email preview
  const getFullEmailContent = () => {
    if (!campaign || !template) return ""

    const parts = [
      template.header || "",
      campaign.content || "",
      template.footer || "",
      template.unsubscribe || ""
    ].filter(part => part.trim())

    return parts.join("\n\n")
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Send Email</h1>
          {urlCampaignName && (
            <p className="text-gray-600">
              Campaign: {urlCampaignName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Campaign Selection */}
              {!urlCampaignId && (
                <div>
                  <Label htmlFor="campaign-select">Select Campaign</Label>
                  <Select
                    value={selectedCampaignId}
                    onValueChange={handleCampaignSelect}
                    disabled={loadingCampaigns}
                  >
                    <SelectTrigger id="campaign-select">
                      <SelectValue placeholder={loadingCampaigns ? "Loading campaigns..." : "Choose a campaign"} />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((camp) => (
                        <SelectItem key={camp.id} value={camp.id}>
                          {camp.name || "Untitled"} ({camp.local})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {campaign && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Subject</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {campaign.subject || "No subject"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Email Content</Label>
                    {loading ? (
                      <div className="min-h-[400px] p-4 border rounded-md bg-gray-50 flex items-center justify-center">
                        <div className="text-gray-500">Loading email content...</div>
                      </div>
                    ) : (
                      <div className="min-h-[400px] border rounded-md bg-white overflow-hidden relative flex items-start justify-center">
                        <div 
                          className="prose prose-sm max-w-none origin-top-left transform"
                          style={{ 
                            fontFamily: 'inherit',
                            lineHeight: '1.6',
                            padding: '16px',
                            transformOrigin: 'top center',
                            zoom: '0.75', // Scale down to fit content
                            width: '133.33%', // Compensate for zoom to fill container
                            height: 'auto'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: getFullEmailContent() || '<p style="color: #6b7280;">No content available</p>' 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {!campaign && !loading && selectedCampaignId && (
                <div className="min-h-[400px] p-4 border rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="text-gray-500">Campaign not found</div>
                </div>
              )}

              {!selectedCampaignId && (
                <div className="min-h-[400px] p-4 border rounded-md bg-gray-50 flex items-center justify-center">
                  <div className="text-gray-500">Select a campaign to preview the email</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Email Form */}
        <div className="space-y-6">
          {/* Email Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="h-5 w-5" />
                Send Single Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emailReceivers">Email Recipients</Label>
                <Textarea
                  id="emailReceivers"
                  value={emailReceivers}
                  onChange={(e) => setEmailReceivers(e.target.value)}
                  placeholder="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
                  className="min-h-[80px]"
                  disabled={!campaign}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple email addresses with commas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Email Variables</CardTitle>
              <p className="text-sm text-gray-600">
                Define variables that can be used in the email template
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variables.map((variable, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value)}
                            placeholder="Variable key"
                            className="text-sm"
                            disabled={!campaign}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variable.value}
                            onChange={(e) => updateVariable(index, 'value', e.target.value)}
                            placeholder="Variable value"
                            className="text-sm"
                            disabled={!campaign}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(index)}
                            className="h-8 w-8 p-0"
                            disabled={!campaign}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariable}
                  className="w-full"
                  disabled={!campaign}
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendEmail}
            disabled={sending || !emailReceivers.trim() || !campaign}
            className="w-full"
            size="lg"
          >
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SendPage() {
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
                <SendPageContent />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}