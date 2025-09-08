import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  try {
    // Use the asset handler to serve static files
    const response = await getAssetFromKV(event, {
      mapRequestToAsset: req => {
        // Handle client-side routing by serving index.html for non-asset requests
        const url = new URL(req.url)
        const pathname = url.pathname
        
        // If it's a file with an extension, serve it as-is
        if (pathname.includes('.')) {
          return req
        }
        
        // For all other paths, serve index.html to handle React Router
        const modifiedUrl = new URL(req.url)
        modifiedUrl.pathname = '/index.html'
        return new Request(modifiedUrl.toString(), req)
      }
    })

    // Add security headers
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    newResponse.headers.set('X-Frame-Options', 'DENY')
    newResponse.headers.set('X-XSS-Protection', '1; mode=block')
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return newResponse
  } catch (e) {
    // If the asset is not found, return a 404
    return new Response(`Not Found: ${e.message}`, { status: 404 })
  }
}