import { createServer } from "node:http"

createServer((req, res) => {
  res.statusCode = 200
  console.log("entrou na página")
  res.end(`funcionou agora ${process.env.NODE_ENV}`)
}).listen(3000)
