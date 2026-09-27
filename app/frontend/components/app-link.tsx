// The ONE place Keel gets its link component. Everything that navigates uses AppLink,
// so every link is an Inertia visit. shadcn parts compose it with asChild:
//   <Button asChild><AppLink href="/orders/new">Create order</AppLink></Button>
//   <SidebarMenuButton asChild><AppLink href="/orders">Orders</AppLink></SidebarMenuButton>
// (Outside Inertia — Storybook, tests — swap this for a forwardRef'd plain <a>.)
export { Link as AppLink } from '@inertiajs/react'
