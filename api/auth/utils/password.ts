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

export class Password {
  private PEPPER: string
  private NORM = "NFC"
  private SCRYPT_OPTIONS: ScryptOptions = {
    N: 2 ** 14,
    r: 8,
    p: 1,
  }
  private DK_LEN = 32
  private SALT_LEN = 16

  constructor(pepper: string) {
    this.PEPPER = pepper
  }

  async hash(password: string) {
    const passwordNormalized = password.normalize(this.NORM)
    const passwordHmac = createHmac("sha256", this.PEPPER)
      .update(passwordNormalized)
      .digest()
    const salt = await randomBytesAsync(this.SALT_LEN)
    const dk = await scryptAsync(
      passwordHmac,
      salt,
      this.DK_LEN,
      this.SCRYPT_OPTIONS,
    )
    return (
      `scrypt$v=1$norm=${this.NORM}$N=${this.SCRYPT_OPTIONS.N},r=${this.SCRYPT_OPTIONS.r},p=${this.SCRYPT_OPTIONS.p}` +
      `$${salt.toString("hex")}$${dk.toString("hex")}`
    )
  }

  private parser(passwordHash: string) {
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

  async verify(password: string, passwordHash: string) {
    try {
      const { store_options, stored_norm, stored_dk, stored_salt } =
        this.parser(passwordHash)
      const passwordNormalized = password.normalize(stored_norm)
      const passwordHmac = createHmac("sha256", this.PEPPER)
        .update(passwordNormalized)
        .digest()
      const dk = await scryptAsync(
        passwordHmac,
        stored_salt,
        this.DK_LEN,
        store_options,
      )
      if (dk.length !== stored_dk.length) return false
      return timingSafeEqual(dk, stored_dk)
    } catch {
      return false
    }
  }
}
