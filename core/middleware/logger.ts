import type { Middleware } from "../router.ts"

export const logger: Middleware = (req, _res) => {
  console.log(`${Date.now()} ${req.method} ${req.pathname}`)
}
