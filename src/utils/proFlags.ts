export const isProBuild = (): boolean => {
  try {
    return Boolean(import.meta.env.MARKREVIEW_PRO)
  } catch {
    return false
  }
}

export const isLicensed = async (): Promise<boolean> => {
  return false
}

export const shouldEnablePro = async (): Promise<boolean> => {
  if (!isProBuild()) return false
  return isLicensed()
}

