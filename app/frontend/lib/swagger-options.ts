type ApiSpec = {
  components: {
    parameters: {
      CsrfToken: { schema: Record<string, unknown> }
    }
  }
}

type SwaggerRequest = {
  url: string
  headers: Record<string, string>
  credentials?: RequestCredentials
}

export function swaggerOptions(source: ApiSpec, csrfToken: string, origin: string) {
  const spec = structuredClone(source)
  // Swagger validates required parameters before invoking the request interceptor.
  spec.components.parameters.CsrfToken.schema.default = csrfToken

  return {
    spec,
    dom_id: '#swagger-ui',
    deepLinking: true,
    validatorUrl: null,
    queryConfigEnabled: false,
    requestInterceptor(request: SwaggerRequest) {
      if (new URL(request.url, origin).origin !== origin) {
        throw new Error('API documentation requests must use the same origin.')
      }
      request.credentials = 'same-origin'
      request.headers['X-CSRF-Token'] = csrfToken
      return request
    },
  }
}
