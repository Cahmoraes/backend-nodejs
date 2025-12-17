import type { IncomingMessage } from "node:http"
import type { UserRole } from "../../api/auth/query.ts"
import { parseCookie } from "../utils/parse-cookies.ts"

export interface Session {
  user_id: number
  role: UserRole
  expires_ms: number
}

export interface CustomRequest extends IncomingMessage {
  query: URLSearchParams
  pathname: string
  body: Record<string, unknown>
  params: Record<string, string>
  ip: string
  cookies: Record<string, string | undefined>
  session: Session | null
  baseurl: string
}

export async function customRequest(
  request: IncomingMessage,
): Promise<CustomRequest> {
  const req = request as CustomRequest
  const url = new URL(req.url ?? "", "http://localhost")
  req.query = url.searchParams
  req.pathname = url.pathname
  req.params = {}
  req.body = {}
  req.ip = req.socket.remoteAddress ?? "127.0.0.1"
  req.cookies = parseCookie(req.headers.cookie)
  req.session = null
  req.baseurl = "http://localhost:3000"
  return req
}
