import { createReadStream, createWriteStream } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { pipeline } from "node:stream/promises"

// setInterval(() => {
//   for (let i = 0; i < 20; i++) {
//     receiveFileStream(i)
//   }
// }, 300)

async function receiveFile(i: number) {
  const body = await readFile("./entrada.txt")
  await writeFile(`./saida-${i}.txt`, body)
}

async function receiveFileStream(i: number) {
  const read = createReadStream("./entrada.txt")
  const write = createWriteStream(`./saida-${i}.txt`)
  pipeline(read, write)
}

async function readStream() {
  const file = createReadStream("./dados.json")
  // const data = await file.toArray()
  const chunks: Buffer[] = []
  for await (const chunk of file) {
    chunks.push(chunk)
  }
  const data = Buffer.concat(chunks)
  console.log(JSON.parse(data.toString()))
}

readStream()
