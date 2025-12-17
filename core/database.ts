import { DatabaseSync, type StatementSync } from 'node:sqlite'
import { LRUCache } from 'lru-cache'

export class Database extends DatabaseSync {
  queries = new LRUCache<string, StatementSync>({
    max: 1000,
  })

  constructor(path: string) {
    super(path)
    this.exec(/*sql*/ `
      PRAGMA foreign_keys = 1;
      PRAGMA journal_mode = DELETE;
      PRAGMA synchronous = NORMAL;

      PRAGMA cache_size = 2000;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;`)
  }

  public query(sql: string): StatementSync {
    let stmt = this.queries.get(sql)
    if (!stmt) {
      stmt = this.prepare(sql)
      this.queries.set(sql, stmt)
    }
    return stmt
  }
}
