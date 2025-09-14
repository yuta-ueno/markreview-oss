/**
 * Pro version detection and feature gating utilities
 */

// Check if this is a Pro version build
export const isProVersion = (): boolean => {
  // In OSS builds, MARKREVIEW_PRO should be false or undefined
  // In Pro builds, MARKREVIEW_PRO should be true
  const proEnv = import.meta.env.MARKREVIEW_PRO
  return proEnv === true || proEnv === 'true'
}

// Check if a specific Pro feature is available
export const isProFeatureAvailable = (feature: string): boolean => {
  const proFeatures = [
    'markdoc',
    'advanced-themes',
    'export-pdf',
    'team-collaboration'
  ]

  return isProVersion() && proFeatures.includes(feature)
}

// Get Pro upgrade message for a feature
export const getProUpgradeMessage = (feature: string): string => {
  const featureMessages: Record<string, string> = {
    markdoc: 'Markdoc syntax support is available in MarkReview Pro. Upgrade to unlock advanced document features.',
    'advanced-themes': 'Additional themes are available in MarkReview Pro.',
    'export-pdf': 'PDF export is a Pro feature. Upgrade to export your documents.',
    'team-collaboration': 'Team collaboration features are available in MarkReview Pro.'
  }

  return featureMessages[feature] || `This feature requires MarkReview Pro. Upgrade to unlock premium features.`
}

// Check if Markdoc specifically is available
export const isMarkdocAvailable = (): boolean => {
  return isProFeatureAvailable('markdoc')
}

// Environment info for debugging
export const getVersionInfo = () => {
  return {
    isPro: isProVersion(),
    env: import.meta.env.MARKREVIEW_PRO,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV
  }
}