import type { ServerResponse } from "node:http"

export interface CustomResponse extends ServerResponse {
  status(statusCode: number): CustomResponse
  json(data: any): void
  setCookie(cookie: string): void
}

export function customResponse(response: ServerResponse) {
  const res = response as CustomResponse
  res.status = (statusCode) => {
    res.statusCode = statusCode
    return res
  }

  res.json = (data) => {
    try {
      res.setHeader("Content-Type", "text/json")
      res.end(JSON.stringify(data))
    } catch {
      res.status(500).end("error")
    }
  }

  res.setCookie = (cookie) => {
    const current = res.getHeader("Set-Cookie")
    if (!current) {
      res.setHeader("Set-Cookie", [cookie])
      return
    }
    if (Array.isArray(current)) {
      current.push(cookie)
      res.setHeader("Set-Cookie", current)
      return
    }
    res.setHeader("Set-Cookie", [String(current), cookie])
  }

  return res
}
