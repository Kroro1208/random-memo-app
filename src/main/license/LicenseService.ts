/**
 * License Service Implementation
 * Core license management functionality for the Random Memo App
 */

import { DatabaseService } from '../database/DatabaseService'
import { 
  License, 
  LicenseType, 
  LicenseActivationRequest, 
  LicenseValidationResult, 
  FeatureAvailability, 
  MemoLimitStatus,
  LicenseLimits
} from '../../shared/types'
import { createHash } from 'crypto'
import * as os from 'os'

/**
 * License error codes for structured error handling
 */
export enum LicenseErrorCode {
  INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED',
  DEVICE_LIMIT_EXCEEDED = 'DEVICE_LIMIT_EXCEEDED',
  MEMO_LIMIT_EXCEEDED = 'MEMO_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
  SERVICE_NOT_INITIALIZED = 'SERVICE_NOT_INITIALIZED'
}

/**
 * License error class for structured error handling
 */
export class LicenseError extends Error {
  constructor(
    public code: LicenseErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'LicenseError'
  }
}

/**
 * Feature definitions for different license tiers
 */
const FEATURE_DEFINITIONS = {
  FREE_TIER: [
    'basic_notes',
    'simple_positioning',
    'basic_theming'
  ],
  PAID_TIER: [
    'basic_notes',
    'simple_positioning',
    'basic_theming',
    'advanced_formatting',
    'cloud_sync',
    'premium_themes',
    'export_features',
    'advanced_search'
  ]
}

/**
 * License validation patterns
 */
const LICENSE_KEY_PATTERNS = {
  STANDARD: /^STANDARD-\d{4}-[A-Z0-9]{12}$/,
  STUDENT: /^STUDENT-\d{4}-[A-Z0-9]{12}$/,
  ENTERPRISE: /^ENTERPRISE-\d{4}-[A-Z0-9]{12}$/
}

/**
 * License Service - Core license management and validation
 */
export class LicenseService {
  private databaseService: DatabaseService
  private isInitialized: boolean = false
  private currentLicense: License | null = null
  private deviceId: string | null = null
  private featureCache: Map<string, { result: FeatureAvailability; timestamp: number }> = new Map()
  
  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService
  }

  /**
   * Initialize the license service
   */
  async initialize(): Promise<void> {
    try {
      // Verify database service is healthy
      const isHealthy = await this.databaseService.healthCheck()
      if (!isHealthy) {
        throw new Error('Database connection failed')
      }

      // Generate or load device ID
      this.deviceId = this.generateDeviceId()

      // Initialize with default free license
      this.currentLicense = {
        licenseKey: null,
        licenseType: 'free',
        activationDate: null,
        lastVerification: null,
        gracePeriodStart: null,
        deviceId: this.deviceId,
        isValid: true,
        daysUntilExpiry: null
      }

      this.isInitialized = true
    } catch (error) {
      throw error
    }
  }

  /**
   * Shutdown the license service
   */
  async shutdown(): Promise<void> {
    this.isInitialized = false
    this.currentLicense = null
    this.deviceId = null
    this.featureCache.clear()
  }

  /**
   * Get current license information
   */
  async getLicenseInfo(): Promise<License> {
    if (!this.isInitialized || !this.currentLicense) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }

    return { ...this.currentLicense }
  }

  /**
   * Get device ID
   */
  getDeviceId(): string {
    if (!this.deviceId) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }
    return this.deviceId
  }

  /**
   * Get license limits based on current license type
   */
  async getLicenseLimits(): Promise<LicenseLimits> {
    if (!this.isInitialized || !this.currentLicense) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }

    switch (this.currentLicense.licenseType) {
      case 'free':
        return {
          maxMemos: 10,
          maxConcurrentMemos: -1,
          featuresEnabled: FEATURE_DEFINITIONS.FREE_TIER
        }
      case 'standard':
      case 'student':
      case 'enterprise':
        return {
          maxMemos: -1, // unlimited
          maxConcurrentMemos: -1,
          featuresEnabled: FEATURE_DEFINITIONS.PAID_TIER
        }
      default:
        return {
          maxMemos: 10,
          maxConcurrentMemos: -1,
          featuresEnabled: FEATURE_DEFINITIONS.FREE_TIER
        }
    }
  }

  /**
   * Activate a license key
   */
  async activateLicense(request: LicenseActivationRequest): Promise<LicenseValidationResult> {
    try {
      // Validate input
      if (!request.licenseKey || request.licenseKey.trim() === '') {
        throw new LicenseError(LicenseErrorCode.INVALID_LICENSE_KEY, 'License key cannot be empty')
      }

      if (!request.deviceId || request.deviceId !== this.deviceId) {
        throw new LicenseError(LicenseErrorCode.INVALID_LICENSE_KEY, 'Invalid device ID')
      }

      // Validate license key format and determine type
      const licenseType = this.validateLicenseKeyFormat(request.licenseKey)
      if (!licenseType) {
        return {
          isValid: false,
          licenseType: 'free',
          limits: await this.getLicenseLimits(),
          error: 'Invalid license key format'
        }
      }

      // Check if license is expired (simulate based on key format)
      if (request.licenseKey.includes('EXPIRED')) {
        return {
          isValid: false,
          licenseType: 'free',
          limits: await this.getLicenseLimits(),
          error: 'License key has expired'
        }
      }

      // Update current license
      this.currentLicense = {
        licenseKey: request.licenseKey,
        licenseType: licenseType,
        activationDate: new Date(),
        lastVerification: new Date(),
        gracePeriodStart: null,
        deviceId: this.deviceId!,
        isValid: true,
        daysUntilExpiry: licenseType === 'student' ? 365 : null
      }

      // Clear caches after license change
      this.clearCaches()

      const limits = await this.getLicenseLimits()

      return {
        isValid: true,
        licenseType: licenseType,
        limits: limits
      }
    } catch (error) {
      if (error instanceof LicenseError) {
        throw error
      }
      throw new LicenseError(LicenseErrorCode.STORAGE_ERROR, 'Failed to activate license', error)
    }
  }

  /**
   * Deactivate current license
   */
  async deactivateLicense(): Promise<void> {
    if (!this.isInitialized) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }

    // Revert to free tier
    this.currentLicense = {
      licenseKey: null,
      licenseType: 'free',
      activationDate: null,
      lastVerification: null,
      gracePeriodStart: null,
      deviceId: this.deviceId!,
      isValid: true,
      daysUntilExpiry: null
    }

    // Clear caches
    this.clearCaches()
  }

  /**
   * Validate current license
   */
  async validateLicense(): Promise<LicenseValidationResult> {
    if (!this.isInitialized || !this.currentLicense) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }

    const limits = await this.getLicenseLimits()

    return {
      isValid: this.currentLicense.isValid,
      licenseType: this.currentLicense.licenseType,
      limits: limits
    }
  }

  /**
   * Check if a memo can be created
   */
  async canCreateMemo(options?: { fallbackToConservative?: boolean }): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.currentLicense) {
        throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
      }

      const limits = await this.getLicenseLimits()
      
      // Unlimited for paid tiers
      if (limits.maxMemos === -1) {
        return true
      }

      // Check current memo count for free tier
      const currentCount = await this.databaseService.getMemoCount()
      return currentCount < limits.maxMemos
    } catch (error) {
      if (options?.fallbackToConservative) {
        return false // Conservative fallback
      }
      
      if (error instanceof LicenseError) {
        throw error
      }
      throw new LicenseError(LicenseErrorCode.DATABASE_ERROR, 'Failed to retrieve memo count', error)
    }
  }

  /**
   * Enforce that a memo can be created (throws if not)
   */
  async enforceCanCreateMemo(): Promise<void> {
    const canCreate = await this.canCreateMemo()
    if (!canCreate) {
      throw new LicenseError(
        LicenseErrorCode.MEMO_LIMIT_EXCEEDED, 
        'Cannot create memo: free tier limit of 10 memos reached'
      )
    }
  }

  /**
   * Get current memo limit status
   */
  async getMemoLimitStatus(): Promise<MemoLimitStatus> {
    try {
      if (!this.isInitialized || !this.currentLicense) {
        throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
      }

      const limits = await this.getLicenseLimits()
      const currentCount = await this.databaseService.getMemoCount()

      const status: MemoLimitStatus = {
        currentCount,
        maxCount: limits.maxMemos,
        canCreate: limits.maxMemos === -1 || currentCount < limits.maxMemos,
        remainingSlots: limits.maxMemos === -1 ? -1 : Math.max(0, limits.maxMemos - currentCount),
        nearLimit: limits.maxMemos !== -1 && currentCount >= (limits.maxMemos - 2) // Warning at 8+ for free tier
      }

      // Cache the result
      return status
    } catch (error) {
      if (error instanceof LicenseError) {
        throw error
      }
      throw new LicenseError(LicenseErrorCode.DATABASE_ERROR, 'Failed to retrieve memo count', error)
    }
  }

  /**
   * Refresh limit status cache
   */
  async refreshLimitStatus(): Promise<void> {
    await this.getMemoLimitStatus()
  }

  /**
   * Check feature availability
   */
  async checkFeatureAvailability(feature: string): Promise<FeatureAvailability> {
    if (!this.isInitialized || !this.currentLicense) {
      throw new LicenseError(LicenseErrorCode.SERVICE_NOT_INITIALIZED, 'License service not initialized')
    }

    // Check cache first
    const cached = this.featureCache.get(feature)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }

    const limits = await this.getLicenseLimits()
    const isAvailable = limits.featuresEnabled.includes(feature)

    const availability: FeatureAvailability = {
      feature,
      available: isAvailable,
      reason: isAvailable ? undefined : 'license_required',
      upgradeMessage: isAvailable ? undefined : `Upgrade to access ${feature.replace('_', ' ')}`
    }

    // Cache the result
    this.featureCache.set(feature, {
      result: availability,
      timestamp: Date.now()
    })

    return availability
  }

  /**
   * Require a feature (throws if not available)
   */
  async requireFeature(feature: string): Promise<void> {
    const availability = await this.checkFeatureAvailability(feature)
    if (!availability.available) {
      throw new LicenseError(
        LicenseErrorCode.FEATURE_NOT_AVAILABLE,
        `Feature ${feature} requires paid license`
      )
    }
  }

  // Private helper methods

  /**
   * Generate a stable device ID
   */
  private generateDeviceId(): string {
    // Use system information to create a stable device ID
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      // Add some system-specific but stable identifiers
      homedir: os.homedir(),
      userInfo: os.userInfo().username
    }

    // Create a hash of the system info for a stable device ID
    const hash = createHash('sha256')
      .update(JSON.stringify(systemInfo))
      .digest('hex')

    // Convert to UUID format for consistency
    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      hash.substring(12, 16),
      hash.substring(16, 20),
      hash.substring(20, 32)
    ].join('-')

    return uuid
  }

  /**
   * Validate license key format and return license type
   */
  private validateLicenseKeyFormat(licenseKey: string): LicenseType | null {
    for (const [type, pattern] of Object.entries(LICENSE_KEY_PATTERNS)) {
      if (pattern.test(licenseKey)) {
        return type.toLowerCase() as LicenseType
      }
    }
    return null
  }

  /**
   * Clear all caches
   */
  private clearCaches(): void {
    this.featureCache.clear()
  }
}