/**
 * Comprehensive test suite for LicenseService
 * Following TDD methodology - RED phase (failing tests)
 */

import { describe, beforeEach, afterEach, it, expect, beforeAll } from 'vitest'
import { LicenseService, LicenseError, LicenseErrorCode } from './LicenseService'
import { DatabaseService } from '../database/DatabaseService'
import { 
  LicenseActivationRequest
} from '../../shared/types'

// Mock DatabaseService to control memo count responses
import { vi } from 'vitest'
vi.mock('../database/DatabaseService')

describe('LicenseService - Core Functionality', () => {
  let licenseService: LicenseService
  let mockDatabaseService: any

  beforeAll(() => {
    // Setup mock for DatabaseService
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>
    mockDatabaseService.getMemoCount = jest.fn()
    mockDatabaseService.initialize = jest.fn()
    mockDatabaseService.healthCheck = jest.fn()
  })

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Create fresh LicenseService instance
    licenseService = new LicenseService(mockDatabaseService)
    
    // Setup default mock responses
    mockDatabaseService.getMemoCount.mockResolvedValue(0)
    mockDatabaseService.healthCheck.mockResolvedValue(true)
  })

  afterEach(async () => {
    // Clean up service
    if (licenseService) {
      await licenseService.shutdown()
    }
  })

  describe('TC-001: LicenseService Initialization', () => {
    it('should initialize successfully with default free tier license', async () => {
      // Act
      await licenseService.initialize()
      const license = await licenseService.getLicenseInfo()

      // Assert
      expect(license).toBeDefined()
      expect(license.licenseType).toBe('free')
      expect(license.licenseKey).toBeNull()
      expect(license.isValid).toBe(true)
      expect(license.deviceId).toBeDefined()
      expect(license.deviceId).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    })

    it('should handle initialization errors gracefully', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(licenseService.initialize()).rejects.toThrow('Database connection failed')
    })

    it('should not allow operations before initialization', async () => {
      // Act & Assert
      await expect(licenseService.getLicenseInfo()).rejects.toThrow(LicenseError)
    })
  })

  describe('TC-002: Device ID Generation and Persistence', () => {
    it('should generate stable device ID that persists across restarts', async () => {
      // Act
      await licenseService.initialize()
      const deviceId1 = licenseService.getDeviceId()
      
      await licenseService.shutdown()
      
      const newService = new LicenseService(mockDatabaseService)
      await newService.initialize()
      const deviceId2 = newService.getDeviceId()
      
      await newService.shutdown()

      // Assert
      expect(deviceId1).toBeDefined()
      expect(deviceId1).toBe(deviceId2)
      expect(deviceId1).toMatch(/^[0-9a-f-]{36}$/) // UUID format
    })

    it('should generate unique device IDs for different instances', async () => {
      // This test would need to mock different system characteristics
      // For now, we verify the format and existence
      await licenseService.initialize()
      const deviceId = licenseService.getDeviceId()
      
      expect(deviceId).toBeDefined()
      expect(deviceId.length).toBeGreaterThan(0)
    })
  })

  describe('TC-003: Free Tier License Info Retrieval', () => {
    beforeEach(async () => {
      await licenseService.initialize()
    })

    it('should return complete license object for free tier', async () => {
      // Act
      const license = await licenseService.getLicenseInfo()

      // Assert
      expect(license).toEqual({
        licenseKey: null,
        licenseType: 'free',
        activationDate: null,
        lastVerification: null,
        gracePeriodStart: null,
        deviceId: expect.any(String),
        isValid: true,
        daysUntilExpiry: null
      })
    })

    it('should return correct limits for free tier', async () => {
      // Act
      const limits = await licenseService.getLicenseLimits()

      // Assert  
      expect(limits).toEqual({
        maxMemos: 10,
        maxConcurrentMemos: -1,
        featuresEnabled: ['basic_notes', 'simple_positioning', 'basic_theming']
      })
    })
  })
})

describe('LicenseService - License Activation and Validation', () => {
  let licenseService: LicenseService
  let mockDatabaseService: any

  beforeAll(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>
    mockDatabaseService.getMemoCount = jest.fn()
    mockDatabaseService.initialize = jest.fn()
    mockDatabaseService.healthCheck = jest.fn()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    licenseService = new LicenseService(mockDatabaseService)
    mockDatabaseService.getMemoCount.mockResolvedValue(0)
    mockDatabaseService.healthCheck.mockResolvedValue(true)
    await licenseService.initialize()
  })

  afterEach(async () => {
    await licenseService.shutdown()
  })

  describe('TC-004: Valid License Key Activation', () => {
    it('should activate valid standard license successfully', async () => {
      // Arrange
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STANDARD-2024-ABC123DEF456',
        deviceId: licenseService.getDeviceId(),
        email: 'user@example.com'
      }

      // Act
      const result = await licenseService.activateLicense(activationRequest)

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.licenseType).toBe('standard')
      expect(result.limits.maxMemos).toBe(-1) // unlimited
      expect(result.error).toBeUndefined()

      // Verify license state changed
      const license = await licenseService.getLicenseInfo()
      expect(license.licenseType).toBe('standard')
      expect(license.licenseKey).toBe('STANDARD-2024-ABC123DEF456')
    })

    it('should activate student license with appropriate limits', async () => {
      // Arrange
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STUDENT-2024-STU123456',
        deviceId: licenseService.getDeviceId()
      }

      // Act
      const result = await licenseService.activateLicense(activationRequest)

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.licenseType).toBe('student')
      expect(result.limits.maxMemos).toBe(-1) // unlimited for student too
    })
  })

  describe('TC-005: Invalid License Key Activation', () => {
    it('should reject malformed license keys', async () => {
      // Arrange
      const invalidRequest: LicenseActivationRequest = {
        licenseKey: 'INVALID-FORMAT',
        deviceId: licenseService.getDeviceId()
      }

      // Act
      const result = await licenseService.activateLicense(invalidRequest)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Invalid license key format')

      // Verify license state unchanged
      const license = await licenseService.getLicenseInfo()
      expect(license.licenseType).toBe('free')
    })

    it('should reject empty license keys', async () => {
      // Arrange
      const invalidRequest: LicenseActivationRequest = {
        licenseKey: '',
        deviceId: licenseService.getDeviceId()
      }

      // Act & Assert
      await expect(licenseService.activateLicense(invalidRequest))
        .rejects.toThrow(new LicenseError(LicenseErrorCode.INVALID_LICENSE_KEY, 'License key cannot be empty'))
    })

    it('should reject expired license keys', async () => {
      // Arrange
      const expiredRequest: LicenseActivationRequest = {
        licenseKey: 'EXPIRED-2023-OLD123456',
        deviceId: licenseService.getDeviceId()
      }

      // Act
      const result = await licenseService.activateLicense(expiredRequest)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('License key has expired')
    })
  })

  describe('TC-006: License Key Format Validation', () => {
    const testCases = [
      { key: 'STANDARD-2024-ABC123DEF456', valid: true, type: 'standard' },
      { key: 'STUDENT-2024-STU123456789', valid: true, type: 'student' },
      { key: 'ENTERPRISE-2024-ENT999888777', valid: true, type: 'enterprise' },
      { key: 'INVALID-FORMAT', valid: false, type: null },
      { key: 'STANDARD-MISSING-PARTS', valid: false, type: null },
      { key: '123-INVALID-ORDER', valid: false, type: null }
    ]

    testCases.forEach(({ key, valid, type }) => {
      it(`should ${valid ? 'accept' : 'reject'} license key: ${key}`, async () => {
        // Arrange
        const request: LicenseActivationRequest = {
          licenseKey: key,
          deviceId: licenseService.getDeviceId()
        }

        // Act
        const result = await licenseService.activateLicense(request)

        // Assert
        expect(result.isValid).toBe(valid)
        if (valid) {
          expect(result.licenseType).toBe(type)
        } else {
          expect(result.error).toBeDefined()
        }
      })
    })
  })

  describe('TC-007: License Deactivation', () => {
    it('should deactivate license and revert to free tier', async () => {
      // Arrange - first activate a license
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STANDARD-2024-ABC123DEF456',
        deviceId: licenseService.getDeviceId()
      }
      await licenseService.activateLicense(activationRequest)

      // Act - deactivate
      await licenseService.deactivateLicense()

      // Assert
      const license = await licenseService.getLicenseInfo()
      expect(license.licenseType).toBe('free')
      expect(license.licenseKey).toBeNull()
      expect(license.isValid).toBe(true)

      const limits = await licenseService.getLicenseLimits()
      expect(limits.maxMemos).toBe(10)
    })

    it('should preserve existing data when deactivating', async () => {
      // This would be tested in integration with the database
      // For now, we verify the call doesn't fail
      await expect(licenseService.deactivateLicense()).resolves.not.toThrow()
    })
  })
})

describe('LicenseService - Freemium Model Enforcement', () => {
  let licenseService: LicenseService
  let mockDatabaseService: any

  beforeAll(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>
    mockDatabaseService.getMemoCount = jest.fn()
    mockDatabaseService.initialize = jest.fn()
    mockDatabaseService.healthCheck = jest.fn()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    licenseService = new LicenseService(mockDatabaseService)
    mockDatabaseService.healthCheck.mockResolvedValue(true)
    await licenseService.initialize()
  })

  afterEach(async () => {
    await licenseService.shutdown()
  })

  describe('TC-008: Free Tier Memo Limit Enforcement', () => {
    it('should allow memo creation when under limit', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(5)

      // Act
      const canCreate = await licenseService.canCreateMemo()

      // Assert
      expect(canCreate).toBe(true)
    })

    it('should block memo creation when at limit', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(10)

      // Act
      const canCreate = await licenseService.canCreateMemo()

      // Assert
      expect(canCreate).toBe(false)
    })

    it('should throw appropriate error when creating memo at limit', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(10)

      // Act & Assert
      await expect(licenseService.enforceCanCreateMemo())
        .rejects.toThrow(new LicenseError(LicenseErrorCode.MEMO_LIMIT_EXCEEDED, 'Cannot create memo: free tier limit of 10 memos reached'))
    })
  })

  describe('TC-009: Paid Tier Unlimited Memos', () => {
    beforeEach(async () => {
      // Activate paid license
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STANDARD-2024-ABC123DEF456',
        deviceId: licenseService.getDeviceId()
      }
      await licenseService.activateLicense(activationRequest)
    })

    it('should allow memo creation regardless of count', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(50) // Well over free limit

      // Act
      const canCreate = await licenseService.canCreateMemo()

      // Assert
      expect(canCreate).toBe(true)
    })

    it('should not throw limit errors for paid users', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(100)

      // Act & Assert
      await expect(licenseService.enforceCanCreateMemo()).resolves.not.toThrow()
    })
  })

  describe('TC-010: Memo Limit Status Tracking', () => {
    it('should return accurate limit status for free tier', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(5)

      // Act
      const status = await licenseService.getMemoLimitStatus()

      // Assert
      expect(status).toEqual({
        currentCount: 5,
        maxCount: 10,
        canCreate: true,
        remainingSlots: 5,
        nearLimit: false
      })
    })

    it('should show near limit warning at 8+ memos', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(8)

      // Act
      const status = await licenseService.getMemoLimitStatus()

      // Assert
      expect(status.nearLimit).toBe(true)
      expect(status.remainingSlots).toBe(2)
    })

    it('should show at limit status', async () => {
      // Arrange
      mockDatabaseService.getMemoCount.mockResolvedValue(10)

      // Act
      const status = await licenseService.getMemoLimitStatus()

      // Assert
      expect(status).toEqual({
        currentCount: 10,
        maxCount: 10,
        canCreate: false,
        remainingSlots: 0,
        nearLimit: true
      })
    })

    it('should show unlimited status for paid tier', async () => {
      // Arrange
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STANDARD-2024-ABC123DEF456',
        deviceId: licenseService.getDeviceId()
      }
      await licenseService.activateLicense(activationRequest)
      mockDatabaseService.getMemoCount.mockResolvedValue(25)

      // Act
      const status = await licenseService.getMemoLimitStatus()

      // Assert
      expect(status).toEqual({
        currentCount: 25,
        maxCount: -1,
        canCreate: true,
        remainingSlots: -1,
        nearLimit: false
      })
    })
  })

  describe('TC-011: Memo Deletion and Limit Updates', () => {
    it('should update limit status after memo count changes', async () => {
      // Arrange - start at limit
      mockDatabaseService.getMemoCount.mockResolvedValueOnce(10)
      const initialStatus = await licenseService.getMemoLimitStatus()
      expect(initialStatus.canCreate).toBe(false)

      // Act - simulate memo deletion (count decreases)
      mockDatabaseService.getMemoCount.mockResolvedValueOnce(9)
      
      // Force cache refresh (in real implementation, this would happen via database events)
      await licenseService.refreshLimitStatus()
      const updatedStatus = await licenseService.getMemoLimitStatus()

      // Assert
      expect(updatedStatus.canCreate).toBe(true)
      expect(updatedStatus.remainingSlots).toBe(1)
    })
  })
})

describe('LicenseService - Feature Gate System', () => {
  let licenseService: LicenseService
  let mockDatabaseService: any

  beforeAll(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>
    mockDatabaseService.getMemoCount = jest.fn()
    mockDatabaseService.initialize = jest.fn()
    mockDatabaseService.healthCheck = jest.fn()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    licenseService = new LicenseService(mockDatabaseService)
    mockDatabaseService.getMemoCount.mockResolvedValue(0)
    mockDatabaseService.healthCheck.mockResolvedValue(true)
    await licenseService.initialize()
  })

  afterEach(async () => {
    await licenseService.shutdown()
  })

  describe('TC-012: Feature Availability Check - Free Tier', () => {
    const featureTests = [
      { feature: 'basic_notes', available: true },
      { feature: 'simple_positioning', available: true },
      { feature: 'basic_theming', available: true },
      { feature: 'advanced_formatting', available: false },
      { feature: 'cloud_sync', available: false },
      { feature: 'premium_themes', available: false },
      { feature: 'export_features', available: false }
    ]

    featureTests.forEach(({ feature, available }) => {
      it(`should ${available ? 'allow' : 'deny'} ${feature} for free tier`, async () => {
        // Act
        const availability = await licenseService.checkFeatureAvailability(feature)

        // Assert
        expect(availability.available).toBe(available)
        expect(availability.feature).toBe(feature)
        
        if (!available) {
          expect(availability.reason).toBe('license_required')
          expect(availability.upgradeMessage).toBeDefined()
        }
      })
    })
  })

  describe('TC-013: Feature Availability Check - Paid Tier', () => {
    beforeEach(async () => {
      // Activate standard license
      const activationRequest: LicenseActivationRequest = {
        licenseKey: 'STANDARD-2024-ABC123DEF456',
        deviceId: licenseService.getDeviceId()
      }
      await licenseService.activateLicense(activationRequest)
    })

    const allFeatures = [
      'basic_notes',
      'simple_positioning', 
      'basic_theming',
      'advanced_formatting',
      'cloud_sync',
      'premium_themes',
      'export_features'
    ]

    allFeatures.forEach(feature => {
      it(`should allow ${feature} for standard license`, async () => {
        // Act
        const availability = await licenseService.checkFeatureAvailability(feature)

        // Assert
        expect(availability.available).toBe(true)
        expect(availability.feature).toBe(feature)
        expect(availability.reason).toBeUndefined()
      })
    })
  })

  describe('TC-014: Feature Requirement Enforcement', () => {
    it('should throw error when requiring unavailable feature', async () => {
      // Act & Assert
      await expect(licenseService.requireFeature('cloud_sync'))
        .rejects.toThrow(new LicenseError(LicenseErrorCode.FEATURE_NOT_AVAILABLE, 'Feature cloud_sync requires paid license'))
    })

    it('should not throw error when requiring available feature', async () => {
      // Act & Assert
      await expect(licenseService.requireFeature('basic_notes')).resolves.not.toThrow()
    })
  })
})

describe('LicenseService - Error Handling and Edge Cases', () => {
  let licenseService: LicenseService
  let mockDatabaseService: any

  beforeAll(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>
    mockDatabaseService.getMemoCount = jest.fn()
    mockDatabaseService.initialize = jest.fn()
    mockDatabaseService.healthCheck = jest.fn()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    licenseService = new LicenseService(mockDatabaseService)
    mockDatabaseService.healthCheck.mockResolvedValue(true)
  })

  afterEach(async () => {
    if (licenseService) {
      await licenseService.shutdown()
    }
  })

  describe('TC-019: Database Service Integration Errors', () => {
    it('should handle database connection failures gracefully', async () => {
      // Arrange
      mockDatabaseService.healthCheck.mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(licenseService.initialize()).rejects.toThrow('Database connection failed')
    })

    it('should handle memo count query failures', async () => {
      // Arrange
      await licenseService.initialize()
      mockDatabaseService.getMemoCount.mockRejectedValue(new Error('Query failed'))

      // Act & Assert
      await expect(licenseService.getMemoLimitStatus())
        .rejects.toThrow(new LicenseError(LicenseErrorCode.DATABASE_ERROR, 'Failed to retrieve memo count'))
    })

    it('should provide fallback when database is unavailable', async () => {
      // Arrange
      await licenseService.initialize()
      mockDatabaseService.getMemoCount.mockRejectedValue(new Error('Database unavailable'))

      // Act - should not throw, but return conservative limits
      const canCreate = await licenseService.canCreateMemo({ fallbackToConservative: true })

      // Assert - should be conservative (false) when database unavailable
      expect(canCreate).toBe(false)
    })
  })

  describe('TC-021: Invalid License State Recovery', () => {
    it('should recover from corrupted license data', async () => {
      // This would test recovery from actual corrupted storage
      // For now, we verify the service can handle invalid states
      
      // Arrange - simulate corrupted state during initialization
      const corruptedService = new LicenseService(mockDatabaseService)
      
      // Act - should recover gracefully
      await expect(corruptedService.initialize()).resolves.not.toThrow()
      
      // Assert - should fall back to free tier
      const license = await corruptedService.getLicenseInfo()
      expect(license.licenseType).toBe('free')
      
      await corruptedService.shutdown()
    })
  })

  describe('TC-022: Concurrent License Operations', () => {
    it('should handle concurrent license operations safely', async () => {
      // Arrange
      await licenseService.initialize()
      mockDatabaseService.getMemoCount.mockResolvedValue(5)

      // Act - multiple concurrent operations
      const promises = [
        licenseService.getMemoLimitStatus(),
        licenseService.canCreateMemo(),
        licenseService.checkFeatureAvailability('basic_notes'),
        licenseService.getLicenseInfo()
      ]

      // Assert - all should complete successfully
      const results = await Promise.all(promises)
      expect(results).toHaveLength(4)
      expect(results.every(result => result !== undefined)).toBe(true)
    })
  })
})

// Additional test utilities and constants for comprehensive testing
export const TEST_LICENSE_KEYS = {
  VALID_STANDARD: 'STANDARD-2024-ABC123DEF456',
  VALID_STUDENT: 'STUDENT-2024-XYZ789ABC123', 
  VALID_ENTERPRISE: 'ENTERPRISE-2024-ENT999888',
  INVALID_FORMAT: 'INVALID-KEY',
  EXPIRED: 'EXPIRED-2023-OLD123456',
  MALFORMED: 'STANDARD-MISSING-PARTS'
}

export const TEST_FEATURES = {
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