import SwaggerUI from 'swagger-ui-dist/swagger-ui-bundle.js'
import 'swagger-ui-dist/swagger-ui.css'
import './api_docs.css'
import { swaggerOptions } from '@/lib/swagger-options'

const container = document.getElementById('swagger-ui')
const schemaUrl = container?.dataset.schemaUrl
const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content

if (container && schemaUrl && csrfToken) {
  fetch(schemaUrl, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
    .then(async (response) => {
      if (!response.ok)
        throw new Error('Unable to load the API contract. Sign in and reload this page.')
      SwaggerUI(swaggerOptions(await response.json(), csrfToken, window.location.origin))
    })
    .catch(() => {
      container.textContent = 'Unable to load API documentation. Sign in and reload this page.'
    })
}
