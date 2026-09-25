import { describe, expect, it } from 'vitest'
import { swaggerOptions } from './swagger-options'

const spec = {
  components: { parameters: { CsrfToken: { schema: { type: 'string' } } } },
}

describe('Swagger session requests', () => {
  it('prefills the required CSRF field without changing the source contract', () => {
    const options = swaggerOptions(spec, 'csrf-value', 'https://app.example')
    expect(options.spec.components.parameters.CsrfToken.schema.default).toBe('csrf-value')
    expect(spec.components.parameters.CsrfToken.schema).not.toHaveProperty('default')
    expect(options.validatorUrl).toBeNull()
  })

  it('sends the current CSRF token and session for same-origin API requests', () => {
    const options = swaggerOptions(spec, 'csrf-value', 'https://app.example')
    const request = options.requestInterceptor({
      url: '/api/v1/items',
      headers: { 'X-CSRF-Token': 'stale' },
    })
    expect(request.headers['X-CSRF-Token']).toBe('csrf-value')
    expect(request.credentials).toBe('same-origin')
  })

  it('does not send credentials to another origin', () => {
    const options = swaggerOptions(spec, 'csrf-value', 'https://app.example')
    expect(() =>
      options.requestInterceptor({ url: 'https://other.example/items', headers: {} })
    ).toThrow('same origin')
  })
})
