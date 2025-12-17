type Cookie = Record<string, string | undefined>

export function parseCookie(cookieHeader?: string) {
  const cookies: Cookie = {}
  if (!cookieHeader) return cookies
  const cookiePairs = cookieHeader.split(";")
  for (const segment of cookiePairs) {
    const pair = segment.trim()
    if (!pair) continue
    const indexOfFirstEquals = pair.indexOf("=")
    const key =
      indexOfFirstEquals === -1
        ? pair
        : pair.slice(0, indexOfFirstEquals).trim()
    const value =
      indexOfFirstEquals === -1 ? "" : pair.slice(indexOfFirstEquals + 1).trim()
    if (!key) continue
    console.log(key, value)
    cookies[key] = value
  }
  return cookies
}
