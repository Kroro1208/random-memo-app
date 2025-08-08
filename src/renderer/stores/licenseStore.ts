/**
 * License Store - Zustand store for license management
 * 
 * This store manages license state, activation, and feature availability checks.
 * Works in conjunction with the memo store for license-aware functionality.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { 
  License, 
  LicenseActivationRequest, 
  LicenseValidationResult, 
  FeatureAvailability,
  MemoLimitStatus,
  IPCResponse 
} from '../../shared/types'

/**
 * License store state interface
 */
export interface LicenseStoreState {
  // License data
  license: License | null
  memoLimitStatus: MemoLimitStatus | null
  
  // Feature availability cache
  featureCache: Map<string, FeatureAvailability>
  
  // UI state
  isActivating: boolean
  isValidating: boolean
  error: string | null
  
  // Upgrade prompts
  showUpgradePrompt: boolean
  upgradePromptType: 'memo_limit' | 'feature_required' | null
  upgradeMessage: string | null
  
  // Actions
  actions: {
    // License management
    activateLicense: (request: LicenseActivationRequest) => Promise<boolean>
    deactivateLicense: () => Promise<void>
    validateLicense: () => Promise<boolean>
    refreshLicenseInfo: () => Promise<void>
    
    // Feature availability
    checkFeature: (feature: string) => Promise<FeatureAvailability>
    isFeatureAvailable: (feature: string) => Promise<boolean>
    requireFeature: (feature: string) => Promise<void>
    clearFeatureCache: () => void
    
    // Memo limits
    refreshMemoLimitStatus: () => Promise<void>
    checkCanCreateMemo: () => Promise<boolean>
    
    // Upgrade prompts
    showUpgrade: (type: 'memo_limit' | 'feature_required', message?: string) => void
    hideUpgradePrompt: () => void
    
    // Utility
    clearError: () => void
    initialize: () => Promise<void>
  }
}

/**
 * Create the license store
 */
export const useLicenseStore = create<LicenseStoreState>()(
  immer((set, get) => ({
    // Initial state
    license: null,
    memoLimitStatus: null,
    featureCache: new Map(),
    isActivating: false,
    isValidating: false,
    error: null,
    showUpgradePrompt: false,
    upgradePromptType: null,
    upgradeMessage: null,

    // Actions
    actions: {
      /**
       * Activate a license with a license key
       */
      activateLicense: async (request: LicenseActivationRequest): Promise<boolean> => {
        try {
          set(state => {
            state.isActivating = true
            state.error = null
          })

          const response: IPCResponse<LicenseValidationResult> = await window.electronAPI.license?.activate?.(request)
          
          if (response?.success && response.data?.isValid) {
            // Refresh license info after successful activation
            await get().actions.refreshLicenseInfo()
            await get().actions.refreshMemoLimitStatus()
            
            // Clear feature cache as features may have changed
            get().actions.clearFeatureCache()
            
            set(state => {
              state.isActivating = false
            })
            
            return true
          } else {
            throw new Error(response?.data?.error || response?.error?.message || 'License activation failed')
          }
        } catch (error) {
          set(state => {
            state.isActivating = false
            state.error = error instanceof Error ? error.message : 'Unknown activation error'
          })
          return false
        }
      },

      /**
       * Deactivate the current license
       */
      deactivateLicense: async () => {
        try {
          set(state => {
            state.error = null
          })

          const response = await window.electronAPI.license?.deactivate?.()
          
          if (response?.success) {
            set(state => {
              state.license = null
              state.memoLimitStatus = null
              state.featureCache.clear()
            })
          } else {
            throw new Error(response?.error?.message || 'License deactivation failed')
          }
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Unknown deactivation error'
          })
        }
      },

      /**
       * Validate the current license
       */
      validateLicense: async (): Promise<boolean> => {
        try {
          set(state => {
            state.isValidating = true
            state.error = null
          })

          const response: IPCResponse<LicenseValidationResult> = await window.electronAPI.license?.validate?.()
          
          set(state => {
            state.isValidating = false
          })
          
          if (response?.success && response.data) {
            // Update license info based on validation result
            await get().actions.refreshLicenseInfo()
            return response.data.isValid
          }
          
          return false
        } catch (error) {
          set(state => {
            state.isValidating = false
            state.error = error instanceof Error ? error.message : 'License validation failed'
          })
          return false
        }
      },

      /**
       * Refresh license information from the main process
       */
      refreshLicenseInfo: async () => {
        try {
          const response: IPCResponse<License> = await window.electronAPI.license?.getInfo?.()
          
          if (response?.success && response.data) {
            set(state => {
              state.license = response.data!
            })
          }
        } catch (error) {
          console.warn('Failed to refresh license info:', error)
        }
      },

      /**
       * Check feature availability with caching
       */
      checkFeature: async (feature: string): Promise<FeatureAvailability> => {
        try {
          // Check cache first
          const cached = get().featureCache.get(feature)
          if (cached) {
            return cached
          }

          const response: IPCResponse<FeatureAvailability> = await window.electronAPI.license?.checkFeature?.(feature)
          
          if (response?.success && response.data) {
            // Cache the result
            set(state => {
              state.featureCache.set(feature, response.data!)
            })
            
            return response.data
          } else {
            // Return conservative fallback
            const fallback: FeatureAvailability = {
              feature,
              available: false,
              reason: 'license_required'
            }
            
            set(state => {
              state.featureCache.set(feature, fallback)
            })
            
            return fallback
          }
        } catch (error) {
          console.warn('Failed to check feature availability:', error)
          
          // Return conservative fallback
          const fallback: FeatureAvailability = {
            feature,
            available: false,
            reason: 'license_required'
          }
          
          return fallback
        }
      },

      /**
       * Simple boolean check for feature availability
       */
      isFeatureAvailable: async (feature: string): Promise<boolean> => {
        const availability = await get().actions.checkFeature(feature)
        return availability.available
      },

      /**
       * Require a feature - throws/shows upgrade prompt if not available
       */
      requireFeature: async (feature: string) => {
        const availability = await get().actions.checkFeature(feature)
        
        if (!availability.available) {
          get().actions.showUpgrade(
            'feature_required',
            availability.upgradeMessage || `${feature} requires a paid license`
          )
          throw new Error(`Feature '${feature}' is not available with current license`)
        }
      },

      /**
       * Clear the feature availability cache
       */
      clearFeatureCache: () => {
        set(state => {
          state.featureCache.clear()
        })
      },

      /**
       * Refresh memo limit status
       */
      refreshMemoLimitStatus: async () => {
        try {
          const response: IPCResponse<MemoLimitStatus> = await window.electronAPI.license?.getLimitStatus?.()
          
          if (response?.success && response.data) {
            set(state => {
              state.memoLimitStatus = response.data!
            })
          }
        } catch (error) {
          console.warn('Failed to refresh memo limit status:', error)
        }
      },

      /**
       * Check if we can create more memos
       */
      checkCanCreateMemo: async (): Promise<boolean> => {
        try {
          const response: IPCResponse<boolean> = await window.electronAPI.license?.canCreateMemo?.()
          return response?.success && response.data === true
        } catch (error) {
          console.warn('Failed to check memo creation ability:', error)
          return false
        }
      },

      /**
       * Show upgrade prompt
       */
      showUpgrade: (type: 'memo_limit' | 'feature_required', message?: string) => {
        set(state => {
          state.showUpgradePrompt = true
          state.upgradePromptType = type
          state.upgradeMessage = message || 'Upgrade to unlock this feature'
        })
      },

      /**
       * Hide upgrade prompt
       */
      hideUpgradePrompt: () => {
        set(state => {
          state.showUpgradePrompt = false
          state.upgradePromptType = null
          state.upgradeMessage = null
        })
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set(state => {
          state.error = null
        })
      },

      /**
       * Initialize the license store
       */
      initialize: async () => {
        await Promise.all([
          get().actions.refreshLicenseInfo(),
          get().actions.refreshMemoLimitStatus()
        ])
      }
    }
  }))
)

/**
 * Helper hooks for accessing specific parts of the license store
 */

// Hook for license data
export const useLicenseData = () => useLicenseStore(state => ({
  license: state.license,
  memoLimitStatus: state.memoLimitStatus,
  isActivating: state.isActivating,
  isValidating: state.isValidating,
  error: state.error
}))

// Hook for feature availability
export const useFeatureAvailability = () => {
  const checkFeature = useLicenseStore(state => state.actions.checkFeature)
  const isFeatureAvailable = useLicenseStore(state => state.actions.isFeatureAvailable)
  const requireFeature = useLicenseStore(state => state.actions.requireFeature)
  
  return {
    checkFeature,
    isFeatureAvailable,
    requireFeature
  }
}

// Hook for upgrade prompts
export const useUpgradePrompt = () => useLicenseStore(state => ({
  showUpgradePrompt: state.showUpgradePrompt,
  upgradePromptType: state.upgradePromptType,
  upgradeMessage: state.upgradeMessage,
  showUpgrade: state.actions.showUpgrade,
  hideUpgradePrompt: state.actions.hideUpgradePrompt
}))

// Hook for license actions
export const useLicenseActions = () => useLicenseStore(state => state.actions)