import type { CustomRequest } from "./http/custom-request.ts"
import type { CustomResponse } from "./http/custom-response.ts"

export type Handler = (
  req: CustomRequest,
  res: CustomResponse,
) => Promise<void> | void

export type Middleware = (
  req: CustomRequest,
  res: CustomResponse,
) => Promise<void> | void

export type Routes = {
  [method: string]: {
    [path: string]: {
      handler: Handler
      middlewares: Middleware[]
    }
  }
}

export class Router {
  public routes: Routes = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {},
    HEAD: {},
  }

  public middlewares: Middleware[] = []

  public get(
    route: string,
    handler: Handler,
    middlewares: Middleware[] = [],
  ): void {
    this.routes["GET"][route] = { handler, middlewares }
  }

  public put(
    route: string,
    handler: Handler,
    middlewares: Middleware[] = [],
  ): void {
    this.routes["PUT"][route] = { handler, middlewares }
  }

  public delete(
    route: string,
    handler: Handler,
    middlewares: Middleware[] = [],
  ): void {
    this.routes["DELETE"][route] = { handler, middlewares }
  }

  public head(
    route: string,
    handler: Handler,
    middlewares: Middleware[] = [],
  ): void {
    this.routes["HEAD"][route] = { handler, middlewares }
  }

  public post(
    route: string,
    handler: Handler,
    middlewares: Middleware[] = [],
  ): void {
    this.routes["POST"][route] = { handler, middlewares }
  }

  public use(middlewares: Middleware[]): void {
    this.middlewares.push(...middlewares)
  }

  public find(method: string, pathname: string) {
    const routesByMethod = this.routes[method]
    if (!routesByMethod) return null
    const matchedRoute = routesByMethod[pathname]
    if (matchedRoute) return { route: matchedRoute, params: {} }

    const reqParts = pathname.split("/").filter(Boolean)
    for (const route of Object.keys(routesByMethod)) {
      if (!route.includes(":")) continue
      const routeParts = route.split("/").filter(Boolean)
      if (reqParts.length !== routeParts.length) continue
      if (reqParts[0] !== routeParts[0]) continue

      const params: Record<string, string> = {}
      let ok = true
      for (let i = 0; i < reqParts.length; i++) {
        const segment = routeParts[i]
        const value = reqParts[i]
        if (segment.startsWith(":")) {
          params[segment.slice(1)] = value
        } else if (segment !== value) {
          ok = false
          break
        }
      }
      if (ok) {
        return { route: routesByMethod[route], params }
      }
    }

    return null
  }
}
