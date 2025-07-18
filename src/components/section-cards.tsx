"use client"

import { IconTrendingDown, IconTrendingUp, IconUsers, IconMail, IconDatabase, IconTarget, IconTemplate } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MetricData {
  value: string
  change: number
  trend: 'up' | 'down'
  description: string
}

export function SectionCards() {
  const [metrics, setMetrics] = useState<{
    totalAudiences: MetricData
    activeAudiences: MetricData
    totalSenders: MetricData
    audienceTypes: MetricData
    totalTemplates: MetricData
  }>({
    totalAudiences: { value: "0", change: 0, trend: 'up', description: "Total audiences created" },
    activeAudiences: { value: "0", change: 0, trend: 'up', description: "Currently active audiences" },
    totalSenders: { value: "0", change: 0, trend: 'up', description: "Email senders configured" },
    audienceTypes: { value: "0", change: 0, trend: 'up', description: "Different audience categories" },
    totalTemplates: { value: "0", change: 0, trend: 'up', description: "Email templates available" }
  })

  // Simulate loading dynamic data
  useEffect(() => {
    const loadMetrics = () => {
      // In a real app, this would fetch from your API
      setMetrics({
        totalAudiences: { 
          value: "1,234", 
          change: 12.5, 
          trend: 'up' as const, 
          description: "Growing audience base" 
        },
        activeAudiences: { 
          value: "987", 
          change: -5.2, 
          trend: 'down' as const, 
          description: "Need engagement boost" 
        },
        totalSenders: { 
          value: "24", 
          change: 8.3, 
          trend: 'up' as const, 
          description: "Sender pool expanding" 
        },
        audienceTypes: { 
          value: "12", 
          change: 15.0, 
          trend: 'up' as const, 
          description: "Diverse segmentation" 
        },
        totalTemplates: { 
          value: "87", 
          change: 22.1, 
          trend: 'up' as const, 
          description: "Template library growing" 
        }
      })
    }

    loadMetrics()
  }, [])

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconUsers className="size-4" />
            Total Audiences
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.totalAudiences.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.totalAudiences.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.totalAudiences.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.totalAudiences.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.totalAudiences.description} {metrics.totalAudiences.trend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Audience creation metrics
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconTarget className="size-4" />
            Active Audiences
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.activeAudiences.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.activeAudiences.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.activeAudiences.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.activeAudiences.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.activeAudiences.description} {metrics.activeAudiences.trend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Engagement tracking needed
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconMail className="size-4" />
            Email Senders
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.totalSenders.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.totalSenders.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.totalSenders.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.totalSenders.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.totalSenders.description} {metrics.totalSenders.trend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Sender management active
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconDatabase className="size-4" />
            Audience Types
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.audienceTypes.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.audienceTypes.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.audienceTypes.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.audienceTypes.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.audienceTypes.description} {metrics.audienceTypes.trend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Segmentation strategy working
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <IconTemplate className="size-4" />
            Email Templates
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.totalTemplates.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.totalTemplates.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {metrics.totalTemplates.trend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {formatChange(metrics.totalTemplates.change)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.totalTemplates.description} {metrics.totalTemplates.trend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Template management active
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
