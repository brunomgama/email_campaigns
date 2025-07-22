"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Calendar } from "../../components/campaigns/campaign-calendar"
import { validate_user } from "@/lib/validate_user"
import MessageLoading from "@/components/spinner/Loading"

export default async function SchedulePage() {
    const session = await validate_user();
  
    if(!session) { return ( <MessageLoading/> ); }

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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Schedule</h1>
                    <p className="text-muted-foreground">
                      View and manage your scheduled email campaigns
                    </p>
                  </div>
                </div>
                
                <Calendar />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}