// Keel block (shadcn "sidebar-07/08" style): workspace switcher · main nav · secondary nav · user menu.
'use client'

import { ChevronsUpDownIcon, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { AppLink } from '@/components/app-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

export type NavItem = {
  /** 1–2 word noun: "Orders". */
  title: string
  url: string
  icon?: LucideIcon
  /** Count of things that need action (not totals). */
  badge?: number
  items?: { title: string; url: string }[]
  matches?: (path: string) => boolean
}
export type NavSection = { label?: string; items: NavItem[] }
export type MenuAction = {
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  href?: string
  shortcut?: string
}

const isActive = (item: { url: string; matches?: (p: string) => boolean }, path: string) =>
  item.matches
    ? item.matches(path)
    : path === item.url || path.startsWith(`${item.url.replace(/\/$/, '')}/`)

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function WorkspaceSwitcher({
  workspace,
}: {
  workspace: {
    name: string
    logoUrl?: string
    plan?: string
    workspaces?: { name: string; url: string }[]
  }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Workspace: ${workspace.name}. Switch workspace`}
            >
              <Avatar className="size-8 rounded-md">
                <AvatarImage src={workspace.logoUrl} alt="" />
                <AvatarFallback className="rounded-md bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                  {initials(workspace.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{workspace.name}</span>
                {workspace.plan && (
                  <span className="truncate text-xs text-muted-foreground">{workspace.plan}</span>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            align="start"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {(workspace.workspaces ?? [{ name: workspace.name, url: '#' }]).map((w) => (
              <DropdownMenuItem key={w.url} asChild>
                <AppLink href={w.url}>{w.name}</AppLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>Create workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavMain({ sections, currentPath }: { sections: NavSection[]; currentPath: string }) {
  return (
    <>
      {sections.map((section, i) => (
        <SidebarGroup key={section.label ?? i}>
          {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const active = isActive(item, currentPath)
                const subActive = item.items?.some((s) => isActive(s, currentPath))
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <AppLink
                        href={item.url}
                        aria-current={active && !subActive ? 'page' : undefined}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </AppLink>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>
                        {item.badge > 99 ? '99+' : item.badge}
                        <span className="sr-only"> need attention</span>
                      </SidebarMenuBadge>
                    ) : null}
                    {active && item.items && (
                      <SidebarMenuSub>
                        {item.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(sub, currentPath)}>
                              <AppLink
                                href={sub.url}
                                aria-current={isActive(sub, currentPath) ? 'page' : undefined}
                              >
                                {sub.title}
                              </AppLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function NavUser({
  user,
}: {
  user: { name: string; email?: string; avatarUrl?: string; menu: MenuAction[][] }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" aria-label={`Account: ${user.name}`}>
              <Avatar className="size-8">
                <AvatarImage src={user.avatarUrl} alt="" />
                <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {user.email && (
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side="top"
            align="start"
          >
            {user.menu.map((group, gi) => (
              <React.Fragment key={JSON.stringify(group.map((action) => action.label))}>
                {gi > 0 && <DropdownMenuSeparator />}
                {group.map((a) => (
                  <DropdownMenuItem key={a.label} onSelect={a.onSelect}>
                    {a.icon && <a.icon />}
                    {a.label}
                  </DropdownMenuItem>
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  currentPath: string
  workspace: React.ComponentProps<typeof WorkspaceSwitcher>['workspace']
  navigation: NavSection[]
  /** Pinned above the user: Settings, Help. */
  secondaryNavigation?: NavItem[]
  user: React.ComponentProps<typeof NavUser>['user']
}

function AppSidebar({
  currentPath,
  workspace,
  navigation,
  secondaryNavigation,
  user,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspace={workspace} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navigation} currentPath={currentPath} />
        {secondaryNavigation && (
          <div className="mt-auto">
            <NavMain sections={[{ items: secondaryNavigation }]} currentPath={currentPath} />
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar, NavMain, NavUser, WorkspaceSwitcher }
