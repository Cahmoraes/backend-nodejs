export {}

type GeneratorFn = Generator<Promise<number>, number, any>

function* main(): Generator<number, any, unknown> {
  console.log("entrou")
  const a = yield 1
  return a
}

const it = main()
console.log(it.next())
console.log(it.next(2))
