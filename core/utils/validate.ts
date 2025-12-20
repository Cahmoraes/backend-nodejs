/** trim e não aceita sting vazia */
import { RouteError } from "./route-error.ts"

function string(x: unknown) {
  if (typeof x !== "string" || x.trim().length === 0) return undefined
  const s = x.trim()
  if (!s.length) return undefined
  return s
}

/** se a string é number like, retorna number, senão undefined */
function number(x: unknown): number | undefined {
  if (typeof x === "number") {
    return Number.isFinite(x) ? x : undefined
  }
  if (typeof x === "string" && x.trim().length !== 0) {
    const n = Number(x)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

/** aceita valores como true, 'true', 1, '1' e 'on' */
function boolean(x: unknown) {
  if (x === true || x === "true" || x === 1 || x === "1" || x === "on") {
    return x
  }
  if (x === false || x === "false" || x === 0 || x === "0" || x === "off") {
    return false
  }
  return undefined
}

/** Verifica se é um objeto {} */
function object(x: unknown): Record<string, unknown> | undefined {
  if (x === null || x === undefined) return undefined
  if (Array.isArray(x)) return undefined
  if (typeof x === "object") return x as Record<string, unknown>
  return undefined
}

const email_re = /^[^@]+@[^@.]+\.[a-z]{2,}$/i

function email(x: unknown) {
  const s = string(x)?.toLowerCase()
  if (!s) return undefined
  return email_re.test(s) ? s : undefined
}

const password_re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

function password(x: unknown) {
  if (typeof x !== "string") return undefined
  if (x.length < 10 || x.length > 256) return undefined
  return password_re.test(x) ? x : undefined
}

type Parse<Value> = (x: unknown) => Value

function required<Value>(fn: Parse<Value>, error: string) {
  return (x: unknown) => {
    const value = fn(x)
    if (value === undefined) throw new RouteError(422, error)
    return value
  }
}

function file(x: unknown) {
  if (typeof x !== "string" || x.trim().length === 0) return undefined
  const file_re = /^(?!\.)[A-Za-z0-9._-]+$/
  return file_re.test(x) ? x : undefined
}

export const v = {
  string: required(string, "string esperada"),
  number: required(number, "número esperado"),
  boolean: required(boolean, "boolean esperado"),
  object: required(object, "objeto esperado"),
  email: required(email, "email inválido"),
  password: required(password, "password inválido"),
  file: required(file, "nome de arquivo inválido"),
  o: {
    string,
    number,
    boolean,
    object,
    email,
    password,
    file,
  },
}
