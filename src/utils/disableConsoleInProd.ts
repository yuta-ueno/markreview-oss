const noop = () => {}

type ImportMetaWithEnv = { env?: { DEV?: boolean } }
type ConsoleLike = {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
}

const isDev = ((import.meta as unknown as ImportMetaWithEnv).env?.DEV) === true

if (!isDev) {
  try {
    const c = console as unknown as ConsoleLike
    c.log = noop
    c.info = noop
    c.debug = noop
    c.warn = noop
  } catch {
    // no-op
  }
}
