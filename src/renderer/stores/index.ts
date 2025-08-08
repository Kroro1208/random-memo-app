/**
 * Store exports - centralized export for all Zustand stores
 */

// Export memo store
export * from './memoStore'

// Export license store  
export * from './licenseStore'

// Re-export commonly used hooks for convenience
export { 
  useMemoStore,
  useMemos, 
  useLicense as useMemoLicense,
  useUIState,
  useMemoActions 
} from './memoStore'

export { 
  useLicenseStore,
  useLicenseData,
  useFeatureAvailability,
  useUpgradePrompt,
  useLicenseActions 
} from './licenseStore'