import type { Session } from "../../../core/http/custom-request.ts"
import type { Middleware } from "../../../core/router.ts"
import { CoreProvider } from "../../../core/utils/abstract.ts"
import { RouteError } from "../../../core/utils/route-error.ts"
import type { UserRole } from "../query.ts"
import { SessionService } from "../services/session.ts"

export class AuthMiddleware extends CoreProvider {
  private session = new SessionService(this.core)

  public guard =
    (role: UserRole): Middleware =>
    (req, res) => {
      res.setHeader("Cache-Control", "private, no-store")
      res.setHeader("Vary", "Cookie")
      const sid = req.cookies[SessionService.COOKIE_SID_KEY]
      if (!sid) throw new RouteError(401, "não autorizado")
      const { valid, cookie, session } = this.session.validate(sid)
      res.setCookie(cookie)
      if (!valid || !session) throw new RouteError(401, "não autorizado")
      if (!this.roleCheck(role, session.role)) {
        throw new RouteError(403, "sem permissão")
      }
      req.session = session as Session
    }

  private roleCheck(requiredRole: UserRole, userRole: UserRole): boolean {
    switch (userRole) {
      case "admin":
        return true
      case "editor":
        return requiredRole === "editor" || requiredRole === "user"
      case "user":
        return requiredRole === "user"
      default:
        return false
    }
  }

  public optional: Middleware = async (req, res) => {
    const sid = req.cookies[SessionService.COOKIE_SID_KEY]
    if (!sid) return
    const { valid, cookie, session } = this.session.validate(sid)
    res.setCookie(cookie)
    if (!valid || !session) return
    res.setHeader("Cache-Control", "private, no-store")
    res.setHeader("Vary", "Cookie")
    req.session = session as Session
  }
}
