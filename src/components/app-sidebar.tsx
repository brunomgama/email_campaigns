"use client"

import * as React from "react"
import {
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconHelp,
  IconInnerShadowTop,
  IconMail,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconTemplate,
  IconSelectAll,
  IconSend,
  IconCalendar,
} from "@tabler/icons-react"

import { NavDocuments } from "../components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Bruno Gama",
    email: "bruno@fixxer.eu",
    avatar: "/next.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
  emails: [
    {
      name: "Senders",
      url: "/senders",
      icon: IconMail,
    },
    {
      name: "Audience Types",
      url: "/audience-types",
      icon: IconUsersGroup,
    },
    {
      name: "Audiences",
      url: "/audiences",
      icon: IconUsers,
    },
    {
      name: "Templates",
      url: "/templates",
      icon: IconTemplate,
    },
    {
      name: "Campaigns",
      url: "/campaigns",
      icon: IconSelectAll,
    },
    {
      name: "Send Email",
      url: "/campaigns/send",
      icon: IconSend,
    },
    {
      name: "Schedule",
      url: "/schedule",
      icon: IconCalendar,
    },
  ],
  analytics: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Fixxer Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments title="Emails" items={data.emails} />
        <NavDocuments title="Documents" items={data.analytics} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
