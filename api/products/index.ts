import { Api } from '../../core/utils/abstract.ts'
import { RouteError } from '../../core/utils/route-error.ts'

export class ProductsApi extends Api {
  public handlers = {
    getProducts: (req, res) => {
      const { slug } = req.params
      const product = this.db
        .query(
          /*sql*/ `
            SELECT * FROM "products" WHERE "slug" = ?
          `,
        )
        .get(slug)
      if (!product) {
        throw new RouteError(404, 'produto não encontrado')
      }
      res.status(200).json(product)
    },
  } satisfies Api['handlers']

  public tables(): void {
    this.db.exec(/*sql*/ `
      CREATE TABLE IF NOT EXISTS "products" (
        "id" INTEGER PRIMARY KEY,
        "name" TEXT,
        "slug" TEXT NOT NULL UNIQUE,
        "price" INTEGER
      );
      INSERT OR IGNORE INTO "products"
      ("name", "slug", "price")
      VALUES
      ('Notebook', 'notebook', 3000)
  `)
  }

  public routes(): void {
    this.router.get('/products/:slug', this.handlers.getProducts)
  }
}
