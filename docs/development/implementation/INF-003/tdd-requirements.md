# TDD Requirements: INF-003 - License System Core Implementation

## Overview
Implement a comprehensive license system for the Random Memo App that enforces freemium model restrictions, manages license validation, and provides feature gating utilities. This system must integrate seamlessly with existing database and IPC layers while ensuring robust security and user experience.

## Functional Requirements

### FR-001: License Validation Service
- **GIVEN** the application starts
- **WHEN** the license service is initialized
- **THEN** it should load and validate current license information
- **AND** determine license type (free, standard, student, enterprise)
- **AND** calculate appropriate limits and restrictions
- **AND** handle invalid or missing license keys gracefully

### FR-002: Freemium Model Enforcement
- **GIVEN** a free tier user
- **WHEN** attempting to create a new memo
- **THEN** it should check current memo count against limit (10 memos)
- **AND** allow creation if under limit
- **AND** reject creation with clear message if at limit
- **AND** suggest upgrade options when approaching limit

- **GIVEN** a paid tier user
- **WHEN** attempting to create a new memo
- **THEN** it should allow unlimited memo creation
- **AND** validate license is still active
- **AND** handle grace period scenarios appropriately

### FR-003: License Activation and Deactivation
- **GIVEN** a valid license key is provided
- **WHEN** activating a license
- **THEN** it should validate key format and authenticity
- **AND** register device with license server (simulated for offline)
- **AND** store activation details securely
- **AND** update user's available features and limits

- **GIVEN** a license needs to be deactivated
- **WHEN** deactivating a license
- **THEN** it should revert to free tier limitations
- **AND** clear stored license data
- **AND** maintain data integrity (keep existing memos)

### FR-004: Feature Gate System
- **GIVEN** a feature requires specific license level
- **WHEN** checking feature availability
- **THEN** it should return boolean availability status
- **AND** provide reason for unavailability if blocked
- **AND** suggest appropriate upgrade path
- **AND** cache results for performance

### FR-005: Memo Limit Status Tracking
- **GIVEN** any memo creation or deletion operation
- **WHEN** the memo count changes
- **THEN** it should update limit status in real-time
- **AND** calculate remaining slots
- **AND** determine if near limit warning should be shown
- **AND** trigger appropriate UI updates via IPC events

### FR-006: Device Registration and Management
- **GIVEN** a license supports multiple devices
- **WHEN** registering current device
- **THEN** it should generate unique device fingerprint
- **AND** store device information securely
- **AND** handle device limit enforcement
- **AND** provide device management capabilities

### FR-007: Grace Period Handling
- **GIVEN** a paid license expires or fails validation
- **WHEN** entering grace period
- **THEN** it should allow continued paid features for limited time
- **AND** show appropriate warnings to user
- **AND** gradually restrict features as grace period expires
- **AND** handle final transition to free tier

## Non-Functional Requirements

### NFR-001: Security
- License keys must be stored securely using OS keychain/credential store
- Device fingerprinting should be privacy-conscious and stable
- License validation should prevent common bypass attempts
- All license operations should be logged for audit purposes

### NFR-002: Performance
- License validation should complete within 50ms for cached results
- Feature gate checks should be sub-millisecond for hot paths
- Memo limit checks should not add perceptible delay to operations
- Background license validation should not impact UI responsiveness

### NFR-003: Reliability
- System should handle network failures gracefully (offline-first)
- License data corruption should be detected and recoverable
- Invalid states should self-correct where possible
- Backup/restore should preserve license status appropriately

### NFR-004: Usability
- License-related error messages should be clear and actionable
- Upgrade prompts should be helpful without being intrusive
- Free tier limitations should be communicated transparently
- License status should be easily accessible to users

### NFR-005: Maintainability
- License system should be modular and testable
- Feature gates should be easy to add and configure
- License types should be extensible for future tiers
- Integration points should be well-documented

## Interface Specifications

### LicenseService Class
```typescript
export class LicenseService {
  // Lifecycle management
  async initialize(): Promise<void>
  async shutdown(): Promise<void>
  
  // License management
  async getLicenseInfo(): Promise<License>
  async activateLicense(request: LicenseActivationRequest): Promise<LicenseValidationResult>
  async deactivateLicense(): Promise<void>
  async validateLicense(): Promise<LicenseValidationResult>
  
  // Feature and limit checking
  async checkFeatureAvailability(feature: string): Promise<FeatureAvailability>
  async getMemoLimitStatus(): Promise<MemoLimitStatus>
  async canCreateMemo(): Promise<boolean>
  
  // Device management
  getDeviceId(): string
  async registerDevice(): Promise<void>
}
```

### FeatureGate Utility
```typescript
export class FeatureGate {
  static async isAvailable(feature: string, licenseService: LicenseService): Promise<boolean>
  static async getAvailability(feature: string, licenseService: LicenseService): Promise<FeatureAvailability>
  static async requireFeature(feature: string, licenseService: LicenseService): Promise<void>
}
```

### License Error Handling
```typescript
export enum LicenseErrorCode {
  INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED',
  DEVICE_LIMIT_EXCEEDED = 'DEVICE_LIMIT_EXCEEDED',
  MEMO_LIMIT_EXCEEDED = 'MEMO_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export class LicenseError extends Error {
  constructor(
    public code: LicenseErrorCode,
    message: string,
    public details?: any
  )
}
```

## Integration Requirements

### Database Integration
- Must use existing DatabaseService for memo count validation
- Should not directly access database - go through DatabaseService
- Must handle DatabaseService errors appropriately
- Should cache results to minimize database calls

### IPC Integration
- Must extend existing IPCHandler with license-related channels
- Should follow same security and error handling patterns
- Must provide real-time updates to renderer process
- Should integrate with existing IPC_CHANNELS constants

### Shared Types Integration
- Must use existing License-related types from interfaces.ts
- Should extend shared types if needed for implementation
- Must maintain compatibility with existing type system
- Should follow same naming conventions

## Acceptance Criteria

### AC-001: Free Tier Enforcement
- [ ] Free users cannot create more than 10 memos
- [ ] Clear error message shown when limit reached
- [ ] Existing memos preserved when transitioning to/from free tier
- [ ] Upgrade suggestions provided at appropriate times

### AC-002: License Activation/Deactivation
- [ ] Valid license keys activate successfully
- [ ] Invalid license keys rejected with clear error
- [ ] License deactivation works without data loss
- [ ] Device registration handles multiple scenarios

### AC-003: Feature Gate Functionality
- [ ] Feature availability checks work for all license types
- [ ] Unavailable features show appropriate messaging
- [ ] Feature gates integrate smoothly with UI components
- [ ] Performance impact is negligible

### AC-004: Real-time Status Updates
- [ ] Memo limit status updates immediately after operations
- [ ] License changes propagate to UI without restart
- [ ] Warning notifications appear at appropriate thresholds
- [ ] Status changes are persisted correctly

### AC-005: Error Handling and Recovery
- [ ] Network failures handled gracefully
- [ ] Corrupted license data recovers automatically
- [ ] Invalid states self-correct where possible
- [ ] All error scenarios provide actionable feedback

### AC-006: Security and Privacy
- [ ] License keys stored securely
- [ ] Device fingerprints are privacy-conscious
- [ ] License bypass attempts are prevented
- [ ] Audit logs capture security-relevant events

## Test Data Requirements

### Valid License Scenarios
```typescript
const freeUser: License = {
  licenseKey: null,
  licenseType: 'free',
  activationDate: null,
  lastVerification: null,
  gracePeriodStart: null,
  deviceId: 'device-123',
  isValid: true,
  daysUntilExpiry: null
}

const paidUser: License = {
  licenseKey: 'VALID-LICENSE-KEY-123',
  licenseType: 'standard',
  activationDate: new Date('2024-01-01'),
  lastVerification: new Date(),
  gracePeriodStart: null,
  deviceId: 'device-123',
  isValid: true,
  daysUntilExpiry: 365
}
```

### License Limits
```typescript
const freeLimits: LicenseLimits = {
  maxMemos: 10,
  maxConcurrentMemos: -1,
  featuresEnabled: ['basic_notes', 'simple_positioning']
}

const paidLimits: LicenseLimits = {
  maxMemos: -1,
  maxConcurrentMemos: -1,  
  featuresEnabled: ['basic_notes', 'simple_positioning', 'advanced_formatting', 'cloud_sync', 'themes']
}
```

### Error Scenarios
```typescript
const errorScenarios = {
  invalidKey: 'INVALID-KEY-FORMAT',
  expiredKey: 'EXPIRED-LICENSE-123',
  deviceLimitExceeded: 'DEVICE-LIMIT-EXCEEDED-456',
  networkError: new Error('Network connection failed'),
  storageError: new Error('Unable to access secure storage')
}
```

## Dependencies
- Existing DatabaseService for memo count queries
- Existing IPCHandler for communication layer
- Existing shared types system
- Node.js crypto module for device fingerprinting
- Secure storage system (OS keychain or similar)
- UUID library for generating identifiers

## Success Metrics
- All acceptance criteria pass with comprehensive test coverage
- License operations complete within performance requirements
- Free tier enforcement is robust and user-friendly
- Feature gates integrate seamlessly with existing components
- Security requirements are met without compromising usability
- System handles edge cases and errors gracefully

## Risk Mitigation
- **License Bypass Risk**: Multiple validation layers and secure storage
- **Performance Impact**: Caching and optimized database queries
- **User Experience**: Clear messaging and progressive upgrade prompts
- **Data Integrity**: Careful handling of license transitions
- **Security Vulnerabilities**: Regular validation and audit logging

## Future Extensibility
- Support for subscription-based licensing
- Enterprise features and custom deployments
- Integration with external payment systems
- Advanced analytics and usage tracking
- Multi-tenant license management