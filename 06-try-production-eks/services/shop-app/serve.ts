// @ts-nocheck
import server from "./dist/server/server.js"
import path from "node:path"

const port = Number(process.env.PORT) || 9001

console.log(`Starting shop-app server on port ${port}...`)

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)

    // Serve static client assets (JS, CSS, images, etc.)
    if (url.pathname !== "/") {
      const filePath = path.join(import.meta.dir, "dist/client", url.pathname)
      const file = Bun.file(filePath)
      if (await file.exists()) {
        return new Response(file)
      }
    }

    // Delegate SSR routes to TanStack Start server handler
    return server.fetch(req)
  },
})
