import { readFile } from "node:fs/promises"
import { AuthApi } from "./api/auth/index.ts"
import { FilesApi } from "./api/files/index.ts"
import { LmsApi } from "./api/lms/index.ts"
import { Core } from "./core/core.ts"
import { logger } from "./core/middleware/logger.ts"
import { rateLimit } from "./core/middleware/rate-limit.ts"

const core = new Core()

core.router.use([logger, rateLimit(10_000, 100)])

new AuthApi(core).init()
new LmsApi(core).init()
new FilesApi(core).init()

core.router.get("/", async (_, res) => {
  const index = await readFile("./front/index.html", "utf-8")
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.status(200).end(index)
})

core.init()
