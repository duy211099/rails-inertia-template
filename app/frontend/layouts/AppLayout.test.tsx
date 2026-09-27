import { describe, expect, it } from 'vitest'
import { buildNavigation } from './AppLayout'

describe('buildNavigation', () => {
  it('includes a Users link for admins, alongside Admin and Versions', () => {
    const [section] = buildNavigation(true)
    const titles = section.items.map((item) => item.title)

    expect(titles).toContain('Users')
  })

  it('omits admin-only links for non-admins', () => {
    const [section] = buildNavigation(false)
    const titles = section.items.map((item) => item.title)

    expect(titles).not.toContain('Users')
  })
})
