import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CampaignsTable } from "@/components/campaigns/campaigns-table"
import MessageLoading from "@/components/spinner/Loading";
import { validate_user } from "@/lib/validate_user";

export default async function CampaignsPage() {
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
                  <div className="flex flex-col gap-4">
                    <CampaignsTable />
                  </div>
                </div>
                </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
}
