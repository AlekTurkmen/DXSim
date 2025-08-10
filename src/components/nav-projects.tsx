"use client"

import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)

  const handleRandomCase = async () => {
    setIsLoadingRandom(true)
    try {
      const response = await fetch('/api/random-case')
      const data = await response.json()
      
      if (data.success && data.case) {
        // Navigate to chat with the random case
        router.push(`/chat?case=${encodeURIComponent(data.case.id)}`)
      } else {
        console.error('Failed to get random case:', data.error)
        // Fallback to regular chat
        router.push('/chat')
      }
    } catch (error) {
      console.error('Error getting random case:', error)
      // Fallback to regular chat
      router.push('/chat')
    } finally {
      setIsLoadingRandom(false)
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Cases</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.name === "New Random Case" ? (
              <SidebarMenuButton
                onClick={handleRandomCase}
                disabled={isLoadingRandom}
                className="w-full flex items-center gap-2 text-left cursor-pointer"
              >
                <item.icon />
                <span>{isLoadingRandom ? "Loading..." : item.name}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
