"use client"

import * as React from "react"
import Link from "next/link"
import {
  MessageSquare,
  History,
  Activity,
  Plus,
  Library,
  LayoutDashboard,
  Database,
  ArrowLeft,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { UsageBadge } from "@/components/ui/bubble-button"
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
    name: "Dr. Smith",
    email: "dr.smith@hospital.com",
    avatar: "/assets/favicon.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
                {
          title: "Pending Cases",
          url: "/dashboard",
        },
        {
          title: "Study & Learn",
          url: "/dashboard",
        },
        {
          title: "Triage Intake",
          url: "/dashboard",
        }
      ],
    },
    {
      title: "Library",
      url: "/library",
      icon: Library,
    },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings,
    //   items: [
    //     {
    //       title: "Preferences",
    //       url: "#",
    //     },
    //     {
    //       title: "AI Model",
    //       url: "#",
    //     },
    //     {
    //       title: "Export Data",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "History",
      url: "/chat",
      icon: History,
    },
    {
      title: "Activity",
      url: "/chat",
      icon: Activity,
    },
  ],
  projects: [
    {
      name: "New Random Case",
      url: "/chat",
      icon: Plus,
    },
    {
      name: "NEJM Case 2412531",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      name: "NEJM Case 2412532",
      url: "/chat",
      icon: MessageSquare,
    },
    {
      name: "NEJM Case 2412533",
      url: "/chat",
      icon: MessageSquare,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                  <ArrowLeft className="size-6" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Back to Home</span>
                  <span className="truncate text-xs">DXSim</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2">
          <UsageBadge
            icon={<Database className="h-4 w-4" />}
            planName="Usage"
            usage={Infinity}
            limit={Infinity}
            tooltipContent={
              <p>
                You have ∞/∞ generations left.
              </p>
            }
          />
        </div>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
