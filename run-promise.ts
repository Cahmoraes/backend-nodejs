function calculateFuture(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1300, 1)
  })
}

function* main(): Generator<Promise<number>, number, number> {
  const a = yield calculateFuture()
  const b = yield Promise.resolve(2)
  return a + b
}

function run<T>(genFn: () => Generator<Promise<any>, T, any>): Promise<T> {
  const it = genFn()

  function step(nextValue?: any): Promise<T> {
    console.log({ nextValue })
    const { value, done } = it.next(nextValue)
    console.log({ value, done })
    if (done) {
      console.log("if")
      console.log({ value, done })
      return Promise.resolve(value)
    }
    console.log("recursion")
    console.log({ value, done })
    return value.then((resolved) => step(resolved))
  }

  return step()
}

run(main).then(console.log)
