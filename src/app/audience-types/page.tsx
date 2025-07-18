import { AppSidebar } from "@/components/app-sidebar"
import { AudienceTypesTable } from "@/components/audience-types/audience-types-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function AudienceTypesPage() {
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
                <div className="flex flex-col gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Audience Types</h1>
                    <p className="text-muted-foreground">
                      Manage audience type categories and classifications
                    </p>
                  </div>
                  <AudienceTypesTable />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}