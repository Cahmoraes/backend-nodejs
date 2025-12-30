import { randomUUID } from "node:crypto"
import { createReadStream, createWriteStream, type Stats } from "node:fs"
import { rename, rm, stat } from "node:fs/promises"
import path, { extname, join } from "node:path"
import { pipeline } from "node:stream/promises"
import type { Handler } from "../../core/router.ts"
import { Api } from "../../core/utils/abstract.ts"
import { RouteError } from "../../core/utils/route-error.ts"
import { v } from "../../core/utils/validate.ts"
import { checkETag, limitBytes, mimeType } from "./utils.ts"

export class FilesApi extends Api {
  private static MAX_BYTES = 150 * 1024 * 1024 // 150 MB
  private static PATH = join("./files/")

  handlers = {
    sendFile: async (req, res) => {
      try {
        const name = v.file(req.params.name)
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        const filePath = join(FilesApi.PATH, name)
        const ext = extname(name)
        let st: Stats
        try {
          st = await stat(filePath)
        } catch {
          throw new RouteError(404, "arquivo não encontrado")
        }
        const etag = `W/${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}`
        res.setHeader("ETag", etag)
        res.setHeader("Content-Length", st.size)
        res.setHeader("Last-Modified", st.mtime.toUTCString())
        res.setHeader(
          "Content-Type",
          mimeType[ext] ?? "application/octet-stream",
        )
        res.setHeader("X-Content-Type-Options", "nosniff")
        res.setHeader("Cache-Control", "public, max-age=0, must-revalidate")
        if (checkETag(req.headers["if-none-match"], etag)) {
          res.status(304)
          res.end()
          return
        }
        res.status(200)
        const file = createReadStream(filePath)
        await pipeline(file, res)
        res.end()
      } catch {
        res.end("arquivo não encontrado")
      }
    },
    uploadFile: async (req, res) => {
      if (req.headers["content-type"] !== "application/octet-stream") {
        throw new RouteError(415, "use octet-streams")
      }
      const contentLength = Number(req.headers["content-length"])
      if (!Number.isInteger(contentLength)) {
        throw new RouteError(400, "content-length inválido")
      }
      if (contentLength > FilesApi.MAX_BYTES) {
        throw new RouteError(413, "corpo grande")
      }
      const name = v.file(req.headers["x-filename"])
      const now = Date.now()
      const ext = extname(name)
      const finalName = `${name.replace(ext, "")}-${now}${ext}`
      const tempPath = join(FilesApi.PATH, `${randomUUID()}.temp`)
      const writePath = join(FilesApi.PATH, finalName)
      const writeStream = createWriteStream(tempPath, { flags: "wx" })
      try {
        await pipeline(req, limitBytes(FilesApi.MAX_BYTES), writeStream)
        await rename(tempPath, writePath)
        res.status(201).json({ path: writePath, name })
      } catch (error) {
        if (error instanceof RouteError) {
          throw new RouteError(error.status, error.message)
        }
        throw new RouteError(500, "erro")
      } finally {
        await rm(tempPath, { force: true }).catch(() => {})
      }
    },
  } satisfies Record<string, Handler>

  protected tables(): void {}

  protected routes(): void {
    this.router.get("/files/:name", this.handlers.sendFile)
    this.router.post("/files", this.handlers.uploadFile)
  }
}
