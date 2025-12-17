import {
  type BinaryLike,
  createHmac,
  randomBytes,
  type ScryptOptions,
  scrypt,
  timingSafeEqual,
} from "node:crypto"
import { promisify } from "node:util"

const randomBytesAsync = promisify(randomBytes)

const scryptAsync: (
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer> = promisify(scrypt)

const SCRYPT_OPTIONS: ScryptOptions = {
  N: 2 ** 14,
  r: 8,
  p: 1,
}

const NORM = "NFC"

const PEPPER = "segredo"

export async function hashPassword(password: string) {
  const passwordNormalized = password.normalize(NORM)
  const passwordHmac = createHmac("sha256", PEPPER)
    .update(passwordNormalized)
    .digest()
  const salt = await randomBytesAsync(16)
  const dk = await scryptAsync(passwordHmac, salt, 32, SCRYPT_OPTIONS)
  return (
    `scrypt$v=1$norm=${NORM}$N=${SCRYPT_OPTIONS.N},r=${SCRYPT_OPTIONS.r},p=${SCRYPT_OPTIONS.p}` +
    `$${salt.toString("hex")}$${dk.toString("hex")}`
  )
}

function parserPasswordHash(passwordHash: string) {
  const [id, v, norm, options, stored_salt_hex, stored_dk_hex] =
    passwordHash.split("$")
  const stored_salt = Buffer.from(stored_salt_hex, "hex")
  const stored_dk = Buffer.from(stored_dk_hex, "hex")
  const stored_norm = norm.replace("norm=", "")
  const store_options = options.split(",").reduce(
    (acc, kv) => {
      const [k, v] = kv.split("=")
      ;(acc as any)[k] = Number(v)
      return acc
    },
    {} as { N: number; r: number; p: number },
  )
  return {
    store_options,
    stored_norm,
    stored_dk,
    stored_salt,
  }
}

async function verifyPassword(password: string, passwordHash: string) {
  const { store_options, stored_norm, stored_dk, stored_salt } =
    parserPasswordHash(passwordHash)
  const passwordNormalized = password.normalize(stored_norm)
  const passwordHmac = createHmac("sha256", PEPPER)
    .update(passwordNormalized)
    .digest()
  const dk = await scryptAsync(passwordHmac, stored_salt, 32, store_options)
  if (dk.length !== stored_dk.length) return false
  return timingSafeEqual(dk, stored_dk)
}

const password = "P@ssw0rd"
const password_hash = await hashPassword(password)
const isTrue = await verifyPassword(password, password_hash)
const isFalse = await verifyPassword("12345678", password_hash)
console.log({ isTrue, isFalse })
