// Re-export generated types from serializers
export type { Item, ItemsIndex, Pagy, User, Version, VersionsIndex } from './serializers'

export type FlashData = {
  notice?: string
  alert?: string
}

export type SharedProps = {
  flash?: FlashData
  user?: User | null
}

// Import User type for SharedProps
import type { User } from './serializers'
