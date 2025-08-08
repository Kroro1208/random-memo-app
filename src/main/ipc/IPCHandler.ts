import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { DatabaseService } from '../database/DatabaseService'
import { LicenseService } from '../license/LicenseService'
import { CreateMemoInput, UpdateMemoInput, IPCResponse, IPC_CHANNELS, LicenseActivationRequest } from '../../shared/types'

/**
 * IPC error codes for structured error handling
 */
export enum IPCErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED_CHANNEL = 'UNAUTHORIZED_CHANNEL',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND'
}

/**
 * IPC Handler class for secure communication between main and renderer processes
 * 
 * This class manages all IPC communication with proper security measures,
 * error handling, and response formatting.
 */
export class IPCHandler {
  private databaseService: DatabaseService
  private licenseService: LicenseService
  private authorizedChannels: Set<string>

  constructor(databaseService: DatabaseService, licenseService: LicenseService) {
    this.databaseService = databaseService
    this.licenseService = licenseService
    this.authorizedChannels = new Set([
      IPC_CHANNELS.MEMO_CREATE,
      IPC_CHANNELS.MEMO_GET_BY_ID,
      IPC_CHANNELS.MEMO_GET_ALL,
      IPC_CHANNELS.MEMO_UPDATE,
      IPC_CHANNELS.MEMO_DELETE,
      IPC_CHANNELS.MEMO_GET_COUNT,
      IPC_CHANNELS.SYSTEM_GET_DISPLAYS,
      IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION,
      IPC_CHANNELS.SETTINGS_GET,
      IPC_CHANNELS.SETTINGS_UPDATE,
      IPC_CHANNELS.LICENSE_GET_INFO,
      IPC_CHANNELS.LICENSE_ACTIVATE,
      IPC_CHANNELS.LICENSE_DEACTIVATE,
      IPC_CHANNELS.LICENSE_VALIDATE,
      IPC_CHANNELS.LICENSE_CHECK_FEATURE,
      IPC_CHANNELS.LICENSE_GET_LIMIT_STATUS,
      IPC_CHANNELS.LICENSE_CAN_CREATE_MEMO
    ])
  }

  /**
   * Initialize IPC handlers for all channels
   */
  async initialize(): Promise<void> {
    try {
      // Register memo operation handlers
      ipcMain.handle(IPC_CHANNELS.MEMO_CREATE, this.handleMemoCreate.bind(this))
      ipcMain.handle(IPC_CHANNELS.MEMO_GET_BY_ID, this.handleMemoGetById.bind(this))
      ipcMain.handle(IPC_CHANNELS.MEMO_GET_ALL, this.handleMemoGetAll.bind(this))
      ipcMain.handle(IPC_CHANNELS.MEMO_UPDATE, this.handleMemoUpdate.bind(this))
      ipcMain.handle(IPC_CHANNELS.MEMO_DELETE, this.handleMemoDelete.bind(this))
      ipcMain.handle(IPC_CHANNELS.MEMO_GET_COUNT, this.handleMemoGetCount.bind(this))

      // Register system operation handlers  
      ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_DISPLAYS, this.handleSystemGetDisplays.bind(this))
      ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, this.handleSystemShowNotification.bind(this))

      // Register settings operation handlers
      ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, this.handleSettingsGet.bind(this))
      ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, this.handleSettingsUpdate.bind(this))

      // Register license operation handlers
      ipcMain.handle(IPC_CHANNELS.LICENSE_GET_INFO, this.handleLicenseGetInfo.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_ACTIVATE, this.handleLicenseActivate.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_DEACTIVATE, this.handleLicenseDeactivate.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_VALIDATE, this.handleLicenseValidate.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_CHECK_FEATURE, this.handleLicenseCheckFeature.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_GET_LIMIT_STATUS, this.handleLicenseGetLimitStatus.bind(this))
      ipcMain.handle(IPC_CHANNELS.LICENSE_CAN_CREATE_MEMO, this.handleLicenseCanCreateMemo.bind(this))

      console.log('IPC handlers initialized successfully')
    } catch (error) {
      throw new Error(`Failed to initialize IPC handlers: ${error}`)
    }
  }

  /**
   * Cleanup IPC handlers and resources
   */
  async cleanup(): Promise<void> {
    try {
      // Remove all registered IPC handlers
      const channels = Array.from(this.authorizedChannels)
      channels.forEach(channel => {
        ipcMain.removeHandler(channel)
      })
      
      console.log('IPC handlers cleaned up successfully')
    } catch (error) {
      console.error('Failed to cleanup IPC handlers:', error)
    }
  }

  /**
   * Register a new IPC channel (with security validation)
   */
  registerChannel(channel: string, handler: Function): void {
    if (!this.authorizedChannels.has(channel)) {
      throw new Error('Unauthorized IPC channel')
    }
    
    // Wrap handler with error handling
    const wrappedHandler = async (...args: any[]) => {
      try {
        return await handler(...args)
      } catch (error) {
        return this.formatErrorResponse(error, channel)
      }
    }
    
    ipcMain.handle(channel, wrappedHandler)
  }

  // Memo CRUD handlers

  /**
   * Handle memo creation
   */
  async handleMemoCreate(_event: IpcMainInvokeEvent, input: CreateMemoInput): Promise<IPCResponse> {
    try {
      // Validate input
      this.validateInput(input, ['content', 'x', 'y'])
      
      // Call database service
      const memo = await this.databaseService.createMemo(input)
      
      // Return formatted response
      return this.formatSuccessResponse(memo)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:create')
    }
  }

  /**
   * Handle get memo by ID
   */
  async handleMemoGetById(_event: IpcMainInvokeEvent, id: string): Promise<IPCResponse> {
    try {
      // Validate ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Validation error: id is required and must be string')
      }
      
      // Call database service
      const memo = await this.databaseService.getMemoById(id)
      
      // Return formatted response
      return this.formatSuccessResponse(memo)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:getById')
    }
  }

  /**
   * Handle get all memos
   */
  async handleMemoGetAll(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      // Call database service
      const memos = await this.databaseService.getAllMemos()
      
      // Return formatted response
      return this.formatSuccessResponse(memos)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:getAll')
    }
  }

  /**
   * Handle memo update
   */
  async handleMemoUpdate(_event: IpcMainInvokeEvent, data: { id: string } & UpdateMemoInput): Promise<IPCResponse> {
    try {
      // Validate input
      if (!data || !data.id) {
        throw new Error('Validation error: id is required')
      }
      
      // Extract ID and update data
      const { id, ...updateInput } = data
      
      // Call database service
      const updatedMemo = await this.databaseService.updateMemo(id, updateInput)
      
      // Return formatted response
      return this.formatSuccessResponse(updatedMemo)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:update')
    }
  }

  /**
   * Handle memo deletion
   */
  async handleMemoDelete(_event: IpcMainInvokeEvent, id: string): Promise<IPCResponse> {
    try {
      // Validate ID parameter
      if (!id || typeof id !== 'string') {
        throw new Error('Validation error: id is required and must be string')
      }
      
      // Call database service
      await this.databaseService.deleteMemo(id)
      
      // Return formatted response (void response)
      return this.formatSuccessResponse(undefined)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:delete')
    }
  }

  /**
   * Handle get memo count
   */
  async handleMemoGetCount(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      // Call database service
      const count = await this.databaseService.getMemoCount()
      
      // Return formatted response
      return this.formatSuccessResponse(count)
    } catch (error) {
      return this.formatErrorResponse(error, 'memo:getCount')
    }
  }

  // System operation handlers (stubs for now)
  
  /**
   * Handle get system displays
   */
  async handleSystemGetDisplays(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      // TODO: Implement display detection
      return this.formatSuccessResponse([])
    } catch (error) {
      return this.formatErrorResponse(error, 'system:getDisplays')
    }
  }

  /**
   * Handle show system notification
   */
  async handleSystemShowNotification(_event: IpcMainInvokeEvent, _request: any): Promise<IPCResponse> {
    try {
      // TODO: Implement notification display
      return this.formatSuccessResponse(undefined)
    } catch (error) {
      return this.formatErrorResponse(error, 'system:showNotification')
    }
  }

  // Settings operation handlers (stubs for now)
  
  /**
   * Handle get settings
   */
  async handleSettingsGet(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      // TODO: Implement settings retrieval
      return this.formatSuccessResponse({})
    } catch (error) {
      return this.formatErrorResponse(error, 'settings:get')
    }
  }

  /**
   * Handle update settings
   */
  async handleSettingsUpdate(_event: IpcMainInvokeEvent, _settings: any): Promise<IPCResponse> {
    try {
      // TODO: Implement settings update
      return this.formatSuccessResponse(_settings)
    } catch (error) {
      return this.formatErrorResponse(error, 'settings:update')
    }
  }

  // License operation handlers

  /**
   * Handle get license info
   */
  async handleLicenseGetInfo(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      const licenseInfo = await this.licenseService.getLicenseInfo()
      return this.formatSuccessResponse(licenseInfo)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:getInfo')
    }
  }

  /**
   * Handle license activation
   */
  async handleLicenseActivate(_event: IpcMainInvokeEvent, request: LicenseActivationRequest): Promise<IPCResponse> {
    try {
      // Validate input
      this.validateInput(request, ['licenseKey', 'deviceId'])
      
      const result = await this.licenseService.activateLicense(request)
      return this.formatSuccessResponse(result)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:activate')
    }
  }

  /**
   * Handle license deactivation
   */
  async handleLicenseDeactivate(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      await this.licenseService.deactivateLicense()
      return this.formatSuccessResponse(undefined)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:deactivate')
    }
  }

  /**
   * Handle license validation
   */
  async handleLicenseValidate(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      const result = await this.licenseService.validateLicense()
      return this.formatSuccessResponse(result)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:validate')
    }
  }

  /**
   * Handle feature availability check
   */
  async handleLicenseCheckFeature(_event: IpcMainInvokeEvent, feature: string): Promise<IPCResponse> {
    try {
      // Validate feature parameter
      if (!feature || typeof feature !== 'string') {
        throw new Error('Validation error: feature name is required and must be string')
      }
      
      const availability = await this.licenseService.checkFeatureAvailability(feature)
      return this.formatSuccessResponse(availability)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:checkFeature')
    }
  }

  /**
   * Handle get memo limit status
   */
  async handleLicenseGetLimitStatus(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      const status = await this.licenseService.getMemoLimitStatus()
      return this.formatSuccessResponse(status)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:getLimitStatus')
    }
  }

  /**
   * Handle can create memo check
   */
  async handleLicenseCanCreateMemo(_event: IpcMainInvokeEvent): Promise<IPCResponse> {
    try {
      const canCreate = await this.licenseService.canCreateMemo()
      return this.formatSuccessResponse(canCreate)
    } catch (error) {
      return this.formatErrorResponse(error, 'license:canCreateMemo')
    }
  }

  // Private helper methods

  /**
   * Format successful response
   */
  private formatSuccessResponse<T>(data: T): IPCResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now()
    }
  }

  /**
   * Format error response with security considerations
   */
  private formatErrorResponse(error: any, channel?: string): IPCResponse {
    // Log error for debugging
    console.error('IPC Error:', {
      channel,
      error,
      timestamp: new Date().toISOString()
    })

    // Determine error code
    let errorCode = IPCErrorCode.INTERNAL_ERROR
    let errorMessage = 'An internal error occurred'

    if (error?.name === 'DatabaseError') {
      errorCode = IPCErrorCode.DATABASE_ERROR
      errorMessage = 'Database operation failed'
    } else if (error?.message?.includes('Validation error')) {
      errorCode = IPCErrorCode.VALIDATION_ERROR
      errorMessage = error.message
    } else if (error?.message?.includes('not found')) {
      errorCode = IPCErrorCode.NOT_FOUND
      errorMessage = 'Resource not found'
    }

    // Sanitize error message to remove sensitive information
    const sanitizedMessage = this.sanitizeErrorMessage(errorMessage)

    return {
      success: false,
      error: {
        code: errorCode,
        message: sanitizedMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      timestamp: Date.now()
    }
  }

  /**
   * Sanitize error messages to prevent information leakage
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message) return 'An error occurred'

    // Remove file paths
    let sanitized = message.replace(/\/[^\s]+/g, '[path]')
    
    // Remove common sensitive patterns
    sanitized = sanitized.replace(/database\.db/gi, '[database]')
    sanitized = sanitized.replace(/\.sqlite/gi, '[database]')
    sanitized = sanitized.replace(/password|token|key|secret/gi, '[sensitive]')
    
    return sanitized
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: any, requiredFields: string[]): void {
    if (!input || typeof input !== 'object') {
      throw new Error('Validation error: Invalid input data')
    }

    for (const field of requiredFields) {
      if (input[field] === undefined || input[field] === null) {
        throw new Error(`Validation error: ${field} is required`)
      }
    }
  }
}