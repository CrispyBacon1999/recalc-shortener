/**
 * Development server for local testing.
 * 
 * For production, deploy to Cloudflare Pages which serves static files directly.
 */

const server = Bun.serve({
  port: 3000,
  
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;
    
    // Route /go to /go.html (matches Cloudflare _redirects)
    if (path === '/go') {
      path = '/go.html';
    }
    
    // Serve index.html for root
    if (path === '/') {
      path = '/index.html';
    }
    
    // Try to serve the file
    const file = Bun.file('public' + path);
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          'Content-Type': getContentType(path),
        },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
});

function getContentType(path: string): string {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

console.log(`🚀 Server running at http://localhost:${server.port}`);
