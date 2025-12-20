import { createReadStream, createWriteStream } from "node:fs"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

const transform = new Transform({
  transform(chunk: Buffer, _encoding, next) {
    const dados = JSON.parse(chunk.toString()) as any[]
    const filtrados = dados.filter((item) => item.vitalicio === "true")
    next(null, JSON.stringify(filtrados))
  },
})

try {
  await pipeline(
    createReadStream("./dados.json", { highWaterMark: 10 }),
    transform,
    createWriteStream("./dados-vitalicio.json"),
  )
} catch (e) {
  console.log(e)
}
