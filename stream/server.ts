import { createReadStream, createWriteStream } from "node:fs"
import { createServer } from "node:http"
import { pipeline } from "node:stream/promises"

const log = createWriteStream("./log.txt", {
  flags: "a",
})

const server = createServer(async (req, res) => {
  const dados = createReadStream("./dados.json", {
    encoding: "utf-8",
    highWaterMark: 10,
  })
  log.write(`${req.method} ${req.socket.remoteAddress}\n`)
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  try {
    await pipeline(dados, res)
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
})

server.listen(3009).on("close", () => {
  log.end()
})
