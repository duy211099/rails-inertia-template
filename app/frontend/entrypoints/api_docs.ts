import './api_docs.css'

const container = document.getElementById('swagger-ui')
const schemaUrl = container?.dataset.schemaUrl
const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

if (container && schemaUrl && csrfToken) {
  Promise.all([
    import('swagger-ui-dist/swagger-ui-bundle.js'),
    import('swagger-ui-dist/swagger-ui.css'),
    import('@/lib/swagger-options'),
    fetch(schemaUrl, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(
      async (response) => {
        if (!response.ok)
          throw new Error('Unable to load the API contract. Sign in and reload this page.')
        return response.json()
      }
    ),
  ])
    .then(([{ default: SwaggerUI }, , { swaggerOptions }, schema]) => {
      SwaggerUI(swaggerOptions(schema, csrfToken, window.location.origin))
    })
    .catch(() => {
      container.textContent = 'Unable to load API documentation. Sign in and reload this page.'
    })
}
