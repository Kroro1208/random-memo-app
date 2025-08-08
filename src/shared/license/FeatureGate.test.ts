/**
 * Comprehensive test suite for FeatureGate utilities
 * Following TDD methodology - RED phase (failing tests)
 */

import { fail } from 'assert';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../../main/database/DatabaseService';
import { LicenseService } from '../../main/license/LicenseService';
import {
  FeatureAvailability,
  License,
  LicenseActivationRequest,
} from '../types';
import {
  FeatureGate,
  FeatureGateError,
  FeatureGateErrorCode,
} from './FeatureGate';

// Mock LicenseService for testing
vi.mock('../../main/license/LicenseService');
const MockedLicenseService = LicenseService;
// Mock DatabaseService as it's a dependency of LicenseService
vi.mock('../../main/database/DatabaseService');
const MockedDatabaseService = DatabaseService;
describe('FeatureGate - Static Utility Methods', () => {
  let mockLicenseService: any;
  let mockDatabaseService: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockDatabaseService = new MockedDatabaseService();
    mockLicenseService = new MockedLicenseService(mockDatabaseService);
    // Setup default mock responses
    mockLicenseService.initialize = vi.fn();
    mockLicenseService.checkFeatureAvailability = vi.fn();
    mockLicenseService.requireFeature = vi.fn();
    mockLicenseService.getLicenseInfo = vi.fn();
  });

  describe('TC-014: FeatureGate.isAvailable() Method', () => {
    it('should return true for available features', async () => {
      // Arrange
      const featureAvailability: FeatureAvailability = {
        feature: 'basic_notes',
        available: true,
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        featureAvailability
      );

      // Act
      const isAvailable = await FeatureGate.isAvailable(
        'basic_notes',
        mockLicenseService
      );

      // Assert
      expect(isAvailable).toBe(true);
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledWith(
        'basic_notes'
      );
    });

    it('should return false for unavailable features', async () => {
      // Arrange
      const featureAvailability: FeatureAvailability = {
        feature: 'cloud_sync',
        available: false,
        reason: 'license_required',
        upgradeMessage: 'Upgrade to access cloud sync',
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        featureAvailability
      );

      // Act
      const isAvailable = await FeatureGate.isAvailable(
        'cloud_sync',
        mockLicenseService
      );

      // Assert
      expect(isAvailable).toBe(false);
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledWith(
        'cloud_sync'
      );
    });

    it('should handle license service errors gracefully', async () => {
      // Arrange
      mockLicenseService.checkFeatureAvailability.mockRejectedValue(
        new Error('License service error')
      );

      // Act & Assert
      await expect(
        FeatureGate.isAvailable('basic_notes', mockLicenseService)
      ).rejects.toThrow(FeatureGateError);
    });

    it('should validate feature name parameter', async () => {
      // Act & Assert
      await expect(
        FeatureGate.isAvailable('', mockLicenseService)
      ).rejects.toThrow(
        new FeatureGateError(
          FeatureGateErrorCode.INVALID_FEATURE_NAME,
          'Feature name cannot be empty'
        )
      );

      await expect(
        FeatureGate.isAvailable(null as any, mockLicenseService)
      ).rejects.toThrow(FeatureGateError);

      await expect(
        FeatureGate.isAvailable(undefined as any, mockLicenseService)
      ).rejects.toThrow(FeatureGateError);
    });

    it('should validate license service parameter', async () => {
      // Act & Assert
      await expect(
        FeatureGate.isAvailable('basic_notes', null as any)
      ).rejects.toThrow(
        new FeatureGateError(
          FeatureGateErrorCode.INVALID_LICENSE_SERVICE,
          'License service is required'
        )
      );

      await expect(
        FeatureGate.isAvailable('basic_notes', undefined as any)
      ).rejects.toThrow(FeatureGateError);
    });
  });

  describe('TC-014: FeatureGate.getAvailability() Method', () => {
    it('should return complete FeatureAvailability object', async () => {
      // Arrange
      const expectedAvailability: FeatureAvailability = {
        feature: 'advanced_formatting',
        available: false,
        reason: 'license_required',
        upgradeMessage:
          'Upgrade to Standard plan for advanced formatting features',
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        expectedAvailability
      );

      // Act
      const availability = await FeatureGate.getAvailability(
        'advanced_formatting',
        mockLicenseService
      );

      // Assert
      expect(availability).toEqual(expectedAvailability);
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledWith(
        'advanced_formatting'
      );
    });

    it('should return availability for free tier features', async () => {
      // Arrange
      const expectedAvailability: FeatureAvailability = {
        feature: 'basic_notes',
        available: true,
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        expectedAvailability
      );

      // Act
      const availability = await FeatureGate.getAvailability(
        'basic_notes',
        mockLicenseService
      );

      // Assert
      expect(availability).toEqual(expectedAvailability);
      expect(availability.reason).toBeUndefined();
      expect(availability.upgradeMessage).toBeUndefined();
    });

    it('should handle different unavailability reasons', async () => {
      const testCases = [
        {
          feature: 'premium_feature',
          reason: 'license_required' as const,
          expectedMessage: expect.stringContaining('license'),
        },
        {
          feature: 'limit_feature',
          reason: 'limit_exceeded' as const,
          expectedMessage: expect.stringContaining('limit'),
        },
        {
          feature: 'future_feature',
          reason: 'not_implemented' as const,
          expectedMessage: expect.stringContaining('coming soon'),
        },
      ];

      for (const testCase of testCases) {
        // Arrange
        const featureAvailability: FeatureAvailability = {
          feature: testCase.feature,
          available: false,
          reason: testCase.reason,
          upgradeMessage: 'Test upgrade message',
        };
        mockLicenseService.checkFeatureAvailability.mockResolvedValue(
          featureAvailability
        );

        // Act
        const availability = await FeatureGate.getAvailability(
          testCase.feature,
          mockLicenseService
        );

        // Assert
        expect(availability.available).toBe(false);
        expect(availability.reason).toBe(testCase.reason);
      }
    });
  });

  describe('TC-014: FeatureGate.requireFeature() Method', () => {
    it('should not throw for available features', async () => {
      // Arrange
      mockLicenseService.requireFeature.mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        FeatureGate.requireFeature('basic_notes', mockLicenseService)
      ).resolves.not.toThrow();

      expect(mockLicenseService.requireFeature).toHaveBeenCalledWith(
        'basic_notes'
      );
    });

    it('should throw for unavailable features', async () => {
      // Arrange
      const licenseError = new Error('Feature not available');
      mockLicenseService.requireFeature.mockRejectedValue(licenseError);

      // Act & Assert
      await expect(
        FeatureGate.requireFeature('cloud_sync', mockLicenseService)
      ).rejects.toThrow(FeatureGateError);

      expect(mockLicenseService.requireFeature).toHaveBeenCalledWith(
        'cloud_sync'
      );
    });

    it('should provide helpful error messages', async () => {
      // Arrange
      const licenseError = new Error(
        'Feature cloud_sync requires paid license'
      );
      mockLicenseService.requireFeature.mockRejectedValue(licenseError);

      // Act & Assert
      try {
        await FeatureGate.requireFeature('cloud_sync', mockLicenseService);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FeatureGateError);
        const featureError = error as FeatureGateError;
        expect(featureError.code).toBe(
          FeatureGateErrorCode.FEATURE_REQUIRED_BUT_UNAVAILABLE
        );
        expect(featureError.message).toContain('cloud_sync');
      }
    });
  });

  describe('FeatureGate - Bulk Operations', () => {
    it('should check multiple features availability efficiently', async () => {
      // Arrange
      const features = ['basic_notes', 'cloud_sync', 'advanced_formatting'];
      const expectedResults = [
        { feature: 'basic_notes', available: true },
        {
          feature: 'cloud_sync',
          available: false,
          reason: 'license_required' as const,
        },
        {
          feature: 'advanced_formatting',
          available: false,
          reason: 'license_required' as const,
        },
      ];

      mockLicenseService.checkFeatureAvailability
        .mockResolvedValueOnce(expectedResults[0])
        .mockResolvedValueOnce(expectedResults[1])
        .mockResolvedValueOnce(expectedResults[2]);

      // Act
      const results = await FeatureGate.checkMultipleFeatures(
        features,
        mockLicenseService
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(results).toEqual(expectedResults);
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledTimes(
        3
      );
    });

    it('should filter available features from a list', async () => {
      // Arrange
      const features = [
        'basic_notes',
        'cloud_sync',
        'simple_positioning',
        'advanced_formatting',
      ];

      // Mock responses for each feature
      mockLicenseService.checkFeatureAvailability.mockImplementation(
        async (feature: string) => {
          const freeFeatures = ['basic_notes', 'simple_positioning'];
          return {
            feature,
            available: freeFeatures.includes(feature),
            reason: freeFeatures.includes(feature)
              ? undefined
              : ('license_required' as const),
          };
        }
      );

      // Act
      const availableFeatures = await FeatureGate.getAvailableFeatures(
        features,
        mockLicenseService
      );

      // Assert
      expect(availableFeatures).toEqual(['basic_notes', 'simple_positioning']);
    });

    it('should get unavailable features with reasons', async () => {
      // Arrange
      const features = ['basic_notes', 'cloud_sync', 'advanced_formatting'];

      mockLicenseService.checkFeatureAvailability.mockImplementation(
        async (feature: string) => {
          const freeFeatures = ['basic_notes'];
          return {
            feature,
            available: freeFeatures.includes(feature),
            reason: freeFeatures.includes(feature)
              ? undefined
              : ('license_required' as const),
            upgradeMessage: freeFeatures.includes(feature)
              ? undefined
              : `Upgrade to access ${feature}`,
          };
        }
      );

      // Act
      const unavailableFeatures = await FeatureGate.getUnavailableFeatures(
        features,
        mockLicenseService
      );

      // Assert
      expect(unavailableFeatures).toHaveLength(2);
      expect(unavailableFeatures[0].feature).toBe('cloud_sync');
      expect(unavailableFeatures[1].feature).toBe('advanced_formatting');
      expect(unavailableFeatures.every(f => !f.available)).toBe(true);
    });
  });

  describe('FeatureGate - Caching and Performance', () => {
    it('should cache feature availability results', async () => {
      // Arrange
      const featureAvailability: FeatureAvailability = {
        feature: 'basic_notes',
        available: true,
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        featureAvailability
      );

      // Act - call same feature multiple times
      await FeatureGate.isAvailable('basic_notes', mockLicenseService);
      await FeatureGate.isAvailable('basic_notes', mockLicenseService);
      await FeatureGate.isAvailable('basic_notes', mockLicenseService);

      // Assert - should only call license service once due to caching
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledTimes(
        1
      );
    });

    it('should respect cache TTL and refresh stale entries', async () => {
      // This test would need to control time/clock for proper testing
      // For now, we test the cache clear functionality

      // Arrange
      const featureAvailability: FeatureAvailability = {
        feature: 'cloud_sync',
        available: false,
        reason: 'license_required',
      };
      mockLicenseService.checkFeatureAvailability.mockResolvedValue(
        featureAvailability
      );

      // Act
      await FeatureGate.isAvailable('cloud_sync', mockLicenseService);
      FeatureGate.clearCache(); // Clear cache
      await FeatureGate.isAvailable('cloud_sync', mockLicenseService);

      // Assert
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledTimes(
        2
      );
    });

    it('should clear cache when license status changes', async () => {
      // This would be tested with actual license change events
      // For now, test manual cache clearing

      // Arrange
      mockLicenseService.checkFeatureAvailability.mockResolvedValue({
        feature: 'basic_notes',
        available: true,
      });

      // Act
      await FeatureGate.isAvailable('basic_notes', mockLicenseService);
      FeatureGate.clearCacheForLicense();
      await FeatureGate.isAvailable('basic_notes', mockLicenseService);

      // Assert
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledTimes(
        2
      );
    });
  });
});

describe('FeatureGate - Integration Scenarios', () => {
  let mockLicenseService: any;
  let mockDatabaseService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDatabaseService = new MockedDatabaseService();
    mockLicenseService = new MockedLicenseService(mockDatabaseService);
    // Setup common mocks
    mockLicenseService.initialize = vi.fn();
    mockLicenseService.checkFeatureAvailability = vi.fn();
    mockLicenseService.getLicenseInfo = vi.fn();
    mockLicenseService.activateLicense = vi.fn();
  });

  describe('License Transition Scenarios', () => {
    it('should update feature availability after license activation', async () => {
      // Arrange - start with free tier
      const freeLicense: License = {
        licenseKey: null,
        licenseType: 'free',
        activationDate: null,
        lastVerification: null,
        gracePeriodStart: null,
        deviceId: 'test-device',
        isValid: true,
        daysUntilExpiry: null,
      };

      const paidLicense: License = {
        licenseKey: 'STANDARD-2024-ABC123',
        licenseType: 'standard',
        activationDate: new Date(),
        lastVerification: new Date(),
        gracePeriodStart: null,
        deviceId: 'test-device',
        isValid: true,
        daysUntilExpiry: 365,
      };

      mockLicenseService.getLicenseInfo
        .mockResolvedValueOnce(freeLicense)
        .mockResolvedValueOnce(paidLicense);

      // Mock feature availability for free tier
      mockLicenseService.checkFeatureAvailability.mockImplementation(
        async (feature: string) => ({
          feature,
          available: ['basic_notes', 'simple_positioning'].includes(feature),
          reason: ['basic_notes', 'simple_positioning'].includes(feature)
            ? undefined
            : ('license_required' as const),
        })
      );

      // Act - check feature before license activation
      const beforeActivation = await FeatureGate.isAvailable(
        'cloud_sync',
        mockLicenseService
      );

      // Mock license activation
      // const activationRequest: LicenseActivationRequest = {
      //   licenseKey: 'STANDARD-2024-ABC123',
      //   deviceId: 'test-device',
      // };

      mockLicenseService.activateLicense.mockResolvedValue({
        isValid: true,
        licenseType: 'standard',
        limits: {
          maxMemos: -1,
          maxConcurrentMemos: -1,
          featuresEnabled: [
            'basic_notes',
            'simple_positioning',
            'cloud_sync',
            'advanced_formatting',
          ],
        },
      });

      // Update mock to reflect activated license
      mockLicenseService.checkFeatureAvailability.mockImplementation(
        async (feature: string) => ({
          feature,
          available: true, // All features available after activation
        })
      );

      // Clear cache to reflect license change
      FeatureGate.clearCacheForLicense();

      // Act - check feature after license activation
      const afterActivation = await FeatureGate.isAvailable(
        'cloud_sync',
        mockLicenseService
      );

      // Assert
      expect(beforeActivation).toBe(false);
      expect(afterActivation).toBe(true);
    });

    it('should handle license deactivation gracefully', async () => {
      // Arrange - start with paid license
      mockLicenseService.checkFeatureAvailability
        .mockResolvedValueOnce({ feature: 'cloud_sync', available: true })
        .mockResolvedValueOnce({
          feature: 'cloud_sync',
          available: false,
          reason: 'license_required' as const,
        });

      // Act
      const beforeDeactivation = await FeatureGate.isAvailable(
        'cloud_sync',
        mockLicenseService
      );

      // Simulate license deactivation
      FeatureGate.clearCacheForLicense();

      const afterDeactivation = await FeatureGate.isAvailable(
        'cloud_sync',
        mockLicenseService
      );

      // Assert
      expect(beforeDeactivation).toBe(true);
      expect(afterDeactivation).toBe(false);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should fallback gracefully when license service is unavailable', async () => {
      // Arrange
      mockLicenseService.checkFeatureAvailability.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      await expect(
        FeatureGate.isAvailable('basic_notes', mockLicenseService, {
          fallbackToConservative: true,
        })
      ).resolves.toBe(false); // Conservative fallback
    });

    it('should retry on transient license service errors', async () => {
      // Arrange
      mockLicenseService.checkFeatureAvailability
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ feature: 'basic_notes', available: true });

      // Act
      const result = await FeatureGate.isAvailable(
        'basic_notes',
        mockLicenseService,
        { retryCount: 1 }
      );

      // Assert
      expect(result).toBe(true);
      expect(mockLicenseService.checkFeatureAvailability).toHaveBeenCalledTimes(
        2
      );
    });
  });
});
