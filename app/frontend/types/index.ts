// Re-export generated types from serializers
export type { Item, User } from './serializers'

export type FlashData = {
  notice?: string
  alert?: string
}

export type SharedProps = {
  flash?: FlashData
  user?: User
}

// Import User type for SharedProps
import type { User } from './serializers'
