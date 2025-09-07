const noop = () => {}

if (!(import.meta as any).env?.DEV) {
  try {
    // Silence non-error logs in production builds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(console as any).log = noop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(console as any).info = noop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(console as any).debug = noop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(console as any).warn = noop
  } catch {
    // no-op
  }
}

