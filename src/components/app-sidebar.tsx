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
    name: "shadcn",
    email: "m@example.com",
    avatar: "/next.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Senders",
      url: "/senders",
      icon: IconMail,
    },
    {
      title: "Audience Types",
      url: "/audience-types",
      icon: IconUsersGroup,
    },
    {
      title: "Audiences",
      url: "/audiences",
      icon: IconUsers,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: IconTemplate,
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: IconSelectAll,
    },
    {
      title: "Send Email",
      url: "campaigns/send",
      icon: IconSend,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
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
                <span className="text-base font-semibold">Bruno Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.analytics} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
