import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http"
import { Database } from "./database.ts"
import { customRequest } from "./http/custom-request.ts"
import { customResponse } from "./http/custom-response.ts"
import { bodyJSON } from "./middleware/body-json.ts"
import { Router } from "./router.ts"
import { RouteError } from "./utils/route-error.ts"

export class Core {
  router: Router
  server: Server
  db: Database

  constructor() {
    this.router = new Router()
    this.router.use([bodyJSON])
    this.db = new Database("./lms.sqlite")
    this.server = createServer(this.handler.bind(this))
  }

  private async handler(request: IncomingMessage, response: ServerResponse) {
    try {
      const req = await customRequest(request)
      const res = customResponse(response)

      for (const middleware of this.router.middlewares) {
        await middleware(req, res)
      }

      const matched = this.router.find(req.method ?? "", req.pathname)
      if (!matched) {
        throw new RouteError(404, "Não encontrado")
      }
      const { route, params } = matched
      req.params = params
      for (const middleware of route.middlewares) {
        await middleware(req, res)
      }
      await route.handler(req, res)
    } catch (error) {
      response.setHeader("content-type", "application/problem+json")
      if (error instanceof RouteError) {
        console.error(
          `${error.status} ${error.message} | ${request.method} ${request.url}`,
        )
        response.statusCode = error.status
        return response.end(
          JSON.stringify({ status: response.statusCode, title: error.message }),
        )
      }
      console.error(error)
      response.statusCode = 500
      response.end(
        JSON.stringify({ status: response.statusCode, title: "error" }),
      )
    }
  }

  public init() {
    this.server.listen(3000, () => {
      console.log("Server: http://localhost:3000")
    })
    this.server.on("clientError", (error, socket) => {
      console.log(error)
      socket.destroy()
    })
  }
}
