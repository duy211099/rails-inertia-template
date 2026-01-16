export type FlashData = {
  notice?: string
  alert?: string
}

export type User = {
  id: number
  name: string
  email: string
  avatar_url?: string
}

export type SharedProps = {
  flash?: FlashData
  user?: User
}
