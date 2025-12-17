import type { Middleware } from "../router.ts"
import { RouteError } from "../utils/route-error.ts"

const MAX_BYTES = 5_000_000

export const bodyJSON: Middleware = async (req, _res) => {
  const contentType = req.headers["content-type"]
  if (
    !contentType ||
    !["application/json", "application/json; charset=utf-8"].includes(
      contentType,
    )
  ) {
    return
  }
  const contentLength = Number(req.headers["content-length"])
  if (!Number.isInteger(contentLength)) {
    throw new RouteError(400, "content-length inválido")
  }
  if (contentLength > MAX_BYTES) {
    throw new RouteError(413, "corpo grande")
  }
  const content: Buffer[] = []
  let size = 0
  try {
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buf.length
      if (size > MAX_BYTES) {
        throw new RouteError(413, "corpo grande")
      }
      content.push(buf)
    }
  } catch {
    throw new RouteError(400, "request abortada")
  }
  try {
    const body = Buffer.concat(content).toString("utf-8")
    if (body === "") {
      req.body = {}
      return
    }
    req.body = JSON.parse(body)
  } catch {
    throw new RouteError(400, "json inválido")
  }
}
