export type FlashData = {
  notice?: string
  alert?: string
}

export type User = {
  id: number
  name: string
  email: string
  avatarUrl?: string
}

export type SharedProps = {
  flash?: FlashData
  user?: User
}
