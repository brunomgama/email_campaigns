"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent} from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { schedulerApi, Schedule } from "@/lib/scheduler-api"
import { campaignsApi, Campaign } from "@/lib/campaigns-api"
import { toast } from "sonner"
import { ScheduleEventModal } from "./schedule-event-modal"

interface CalendarEvent {
  schedule: Schedule
  campaign?: Campaign
  date: Date
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch scheduled campaigns
  const fetchScheduledCampaigns = async () => {
    try {
      setLoading(true)
      const schedules = await schedulerApi.list({ limit: 100 })
      
      const calendarEvents: CalendarEvent[] = []
      
      for (const schedule of schedules.results) {
        try {
          const campaign = await campaignsApi.getOne(schedule.campaignId)
          calendarEvents.push({
            schedule,
            campaign,
            date: new Date(schedule.scheduled_time)
          })
        } catch{
          // Campaign might not exist, add schedule without campaign details
          calendarEvents.push({
            schedule,
            date: new Date(schedule.scheduled_time)
          })
        }
      }
      
      setEvents(calendarEvents)
    } catch (err) {
      console.error("Error fetching scheduled campaigns:", err)
      toast.error("Failed to load scheduled campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledCampaigns()
  }, [])

  // Navigation functions
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  // Generate calendar days for month view
  const getMonthDays = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Get the first day of the week (Sunday = 0)
    const startDay = start.getDay()
    const daysInMonth = end.getDate()
    
    const days: Date[] = []
    
    // Add previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(start)
      date.setDate(date.getDate() - i - 1)
      days.push(date)
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }
    
    // Add next month's leading days to complete the grid
    const remaining = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      days.push(date)
    }
    
    return days
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading scheduled campaigns...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {formatMonthYear(currentDate)}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* <Tabs value={view} onValueChange={(value) => setView(value as "week" | "month")}> */}
                {/* <TabsList> */}
                  {/* <TabsTrigger value="week">Week</TabsTrigger> */}
                  {/* <TabsTrigger value="month">Month</TabsTrigger> */}
                {/* </TabsList> */}
              {/* </Tabs> */}
              
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              
              <div className="flex items-center">
                <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={"month"} className="w-full">
            <TabsContent value="month" className="mt-0">
              <MonthView 
                days={getMonthDays()}
                currentDate={currentDate}
                getEventsForDate={getEventsForDate}
                onEventClick={handleEventClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ScheduleEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
      />
    </>
  )
}

interface MonthViewProps {
  days: Date[]
  currentDate: Date
  getEventsForDate: (date: Date) => CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

function MonthView({ days, currentDate, getEventsForDate, onEventClick }: MonthViewProps) {
  const today = new Date()
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Week day headers */}
      {weekDays.map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((day, index) => {
        const dayEvents = getEventsForDate(day)
        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
        const isToday = day.toDateString() === today.toDateString()
        
        return (
          <div
            key={index}
            className={`min-h-[120px] p-2 border rounded-lg ${
              isCurrentMonth ? "bg-background" : "bg-muted/30"
            } ${isToday ? "ring-2 ring-primary" : ""}`}
          >
            <div className={`text-sm font-medium mb-1 ${
              isCurrentMonth ? "text-foreground" : "text-muted-foreground"
            }`}>
              {day.getDate()}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event, eventIndex) => (
                <div
                  key={eventIndex}
                  onClick={() => onEventClick(event)}
                  className="cursor-pointer"
                >
                  <Badge 
                    variant="secondary" 
                    className="text-xs truncate w-full justify-start hover:bg-secondary/80"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {event.campaign?.name || "Untitled Campaign"}
                  </Badge>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}