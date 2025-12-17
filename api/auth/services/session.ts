import { CoreProvider } from "../../../core/utils/abstract.ts"
import { AuthQuery, type UserRole } from "../query.ts"
import { randomBytesAsync, sha256 } from "../utils/utils.ts"

export interface SessionServiceOutput {
  cookie: string
}

export interface CreateSessionData {
  userId: number
  ip: string
  ua: string
}

export interface ResetTokenOutput {
  token: string
}

export class SessionService extends CoreProvider {
  private static TTLSec = 60 * 60 * 24 * 15
  private static TTLSec5days = 60 * 60 * 24 * 15
  public static COOKIE_SID_KEY = "__Secure-sid"

  query = new AuthQuery(this.db)

  public async create({
    userId,
    ip,
    ua,
  }: CreateSessionData): Promise<SessionServiceOutput> {
    const bytes = await randomBytesAsync(32)
    const sid = bytes.toString("base64url")
    const sid_hash = sha256(sid)
    const expires_ms = Date.now() + SessionService.TTLSec * 1000
    this.query.insertSession({ sid_hash, user_id: userId, ip, ua, expires_ms })
    return { cookie: this.sidCookie(sid) }
  }

  private sidCookie(sid: string, maxAge?: number): string {
    return `${SessionService.COOKIE_SID_KEY}=${sid}; Path=/; Max-Age=${maxAge ?? SessionService.TTLSec}; HttpOnly; Secure; SameSite=Lax`
  }

  public validate(sid: string) {
    const now = Date.now()
    const sid_hash = sha256(sid)
    const session = this.query.selectSession(sid_hash)
    if (!session || session.revoked) {
      return {
        valid: false,
        cookie: this.sidCookie("", 0),
      }
    }
    let expires_ms = session.expires_ms
    if (now >= expires_ms) {
      this.query.revokeSession(sid_hash)
      return {
        valid: false,
        cookie: this.sidCookie("", 0),
      }
    }
    if (now >= expires_ms - 1000 * SessionService.TTLSec5days) {
      const expires_msUpdate = now + 1000 * SessionService.TTLSec
      this.query.updateSessionExpires(sid_hash, expires_msUpdate)
      expires_ms = expires_msUpdate
    }
    const user = this.query.selectUserRole(session.user_id)
    if (!user) {
      this.query.revokeSession(sid_hash)
      return {
        valid: false,
        cookie: this.sidCookie("", 0),
      }
    }
    return {
      valid: true,
      cookie: this.sidCookie(sid, Math.floor((expires_ms - now) / 1000)),
      session: {
        user_id: session.user_id,
        role: user.role as UserRole,
        expires_ms,
      },
    }
  }

  public async invalidate(sid?: string) {
    const cookie = this.sidCookie("", 0)
    try {
      if (sid) {
        const sid_hash = sha256(sid)
        this.query.revokeSession(sid_hash)
      }
    } catch {}
    return { cookie }
  }

  public invalidateAll(userId: number) {
    this.query.revokeSessions(userId)
  }

  public async resetToken({
    userId,
    ip,
    ua,
  }: CreateSessionData): Promise<ResetTokenOutput> {
    const bytes = await randomBytesAsync(32)
    const token = bytes.toString("base64url")
    const token_hash = sha256(token)
    const expires_ms = Date.now() + 1000 * 60 * 30 // 30 minutos
    this.query.insertReset({ token_hash, expires_ms, user_id: userId, ip, ua })
    return { token }
  }

  public async validateToken(token: string) {
    const now = Date.now()
    const token_hash = sha256(token)
    const reset = this.query.selectReset(token_hash)
    if (!reset) return null
    if (now > reset.expires_ms) {
      return null
    }
    this.query.revokeSessions(reset.user_id)
    this.query.deleteReset(reset.user_id)
    return { user_id: reset.user_id }
  }
}
