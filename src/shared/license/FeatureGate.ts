/**
 * FeatureGate Utility
 * Provides convenient static methods for checking feature availability
 */

import { LicenseService } from '../../main/license/LicenseService'
import { FeatureAvailability } from '../types'

/**
 * FeatureGate error codes for structured error handling
 */
export enum FeatureGateErrorCode {
  INVALID_FEATURE_NAME = 'INVALID_FEATURE_NAME',
  INVALID_LICENSE_SERVICE = 'INVALID_LICENSE_SERVICE',
  FEATURE_REQUIRED_BUT_UNAVAILABLE = 'FEATURE_REQUIRED_BUT_UNAVAILABLE',
  LICENSE_SERVICE_ERROR = 'LICENSE_SERVICE_ERROR'
}

/**
 * FeatureGate error class
 */
export class FeatureGateError extends Error {
  constructor(
    public code: FeatureGateErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'FeatureGateError'
  }
}

/**
 * Options for FeatureGate operations
 */
interface FeatureGateOptions {
  fallbackToConservative?: boolean
  retryCount?: number
}

/**
 * FeatureGate utility class
 * Provides static methods for checking feature availability and requirements
 */
export class FeatureGate {
  // Static cache for feature availability results
  private static featureCache: Map<string, { result: FeatureAvailability; timestamp: number }> = new Map()
  
  // Cache TTL in milliseconds (1 minute for feature gate cache)
  private static readonly CACHE_TTL = 60 * 1000

  /**
   * Check if a feature is available (returns boolean)
   */
  static async isAvailable(
    feature: string, 
    licenseService: LicenseService, 
    options?: FeatureGateOptions
  ): Promise<boolean> {
    try {
      // Validate inputs
      this.validateInputs(feature, licenseService)

      const availability = await this.getAvailability(feature, licenseService, options)
      return availability.available
    } catch (error) {
      if (options?.fallbackToConservative) {
        return false
      }
      
      if (error instanceof FeatureGateError) {
        throw error
      }
      
      throw new FeatureGateError(
        FeatureGateErrorCode.LICENSE_SERVICE_ERROR,
        'Error checking feature availability',
        error
      )
    }
  }

  /**
   * Get complete feature availability information
   */
  static async getAvailability(
    feature: string, 
    licenseService: LicenseService,
    options?: FeatureGateOptions
  ): Promise<FeatureAvailability> {
    try {
      // Validate inputs
      this.validateInputs(feature, licenseService)

      // Check cache first
      const cacheKey = `${feature}_${licenseService.getDeviceId()}`
      const cached = this.featureCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result
      }

      // Get fresh result with retry logic
      let lastError: Error | null = null
      const maxRetries = options?.retryCount ?? 0

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await licenseService.checkFeatureAvailability(feature)
          
          // Cache the result
          this.featureCache.set(cacheKey, {
            result,
            timestamp: Date.now()
          })
          
          return result
        } catch (error) {
          lastError = error as Error
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
            continue
          }
        }
      }

      // All retries failed
      throw lastError || new Error('Unknown error')
    } catch (error) {
      if (error instanceof FeatureGateError) {
        throw error
      }
      
      throw new FeatureGateError(
        FeatureGateErrorCode.LICENSE_SERVICE_ERROR,
        `Failed to get availability for feature: ${feature}`,
        error
      )
    }
  }

  /**
   * Require a feature (throws if not available)
   */
  static async requireFeature(
    feature: string, 
    licenseService: LicenseService
  ): Promise<void> {
    try {
      // Validate inputs
      this.validateInputs(feature, licenseService)

      await licenseService.requireFeature(feature)
    } catch (error) {
      if (error instanceof FeatureGateError) {
        throw error
      }
      
      throw new FeatureGateError(
        FeatureGateErrorCode.FEATURE_REQUIRED_BUT_UNAVAILABLE,
        `Required feature '${feature}' is not available`,
        error
      )
    }
  }

  /**
   * Check multiple features at once
   */
  static async checkMultipleFeatures(
    features: string[], 
    licenseService: LicenseService
  ): Promise<FeatureAvailability[]> {
    const promises = features.map(feature => 
      this.getAvailability(feature, licenseService)
    )
    return Promise.all(promises)
  }

  /**
   * Get list of available features from a list
   */
  static async getAvailableFeatures(
    features: string[], 
    licenseService: LicenseService
  ): Promise<string[]> {
    const availabilities = await this.checkMultipleFeatures(features, licenseService)
    return availabilities
      .filter(availability => availability.available)
      .map(availability => availability.feature)
  }

  /**
   * Get list of unavailable features with reasons
   */
  static async getUnavailableFeatures(
    features: string[], 
    licenseService: LicenseService
  ): Promise<FeatureAvailability[]> {
    const availabilities = await this.checkMultipleFeatures(features, licenseService)
    return availabilities.filter(availability => !availability.available)
  }

  /**
   * Clear all cached feature availability results
   */
  static clearCache(): void {
    this.featureCache.clear()
  }

  /**
   * Clear cache for a specific license (when license changes)
   */
  static clearCacheForLicense(): void {
    // For now, clear all cache when license changes
    // In future, could be more selective based on device ID
    this.clearCache()
  }

  /**
   * Clear cache for specific feature
   */
  static clearCacheForFeature(feature: string): void {
    // Remove all cache entries for this feature (across all licenses)
    const keysToRemove: string[] = []
    for (const key of this.featureCache.keys()) {
      if (key.startsWith(`${feature}_`)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => this.featureCache.delete(key))
  }

  // Private helper methods

  /**
   * Validate inputs for FeatureGate methods
   */
  private static validateInputs(feature: string, licenseService: LicenseService): void {
    // Validate feature name
    if (!feature || typeof feature !== 'string' || feature.trim() === '') {
      throw new FeatureGateError(
        FeatureGateErrorCode.INVALID_FEATURE_NAME,
        'Feature name cannot be empty'
      )
    }

    // Validate license service
    if (!licenseService) {
      throw new FeatureGateError(
        FeatureGateErrorCode.INVALID_LICENSE_SERVICE,
        'License service is required'
      )
    }
  }
}