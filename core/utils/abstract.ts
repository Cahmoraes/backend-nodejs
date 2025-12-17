import type { Core } from '../core.ts'
import type { Database } from '../database.ts'
import type { Handler, Router } from '../router.ts'

export abstract class CoreProvider {
  readonly core: Core
  readonly db: Database
  readonly router: Router

  constructor(core: Core) {
    this.core = core
    this.db = core.db
    this.router = core.router
  }
}

export abstract class Api extends CoreProvider {
  abstract handlers: Record<string, Handler>
  /** Utilize para criar as tabelas */
  protected abstract tables(): void

  /** Registre as rotas da API aqui */
  protected abstract routes(): void

  public init() {
    this.tables()
    this.routes()
  }
}

export abstract class Query {
  protected db: Database

  constructor(db: Database) {
    this.db = db
  }
}
