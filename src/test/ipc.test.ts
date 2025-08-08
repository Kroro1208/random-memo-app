import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from 'vitest'
import { BrowserWindow, ipcMain } from 'electron'
import { IPCHandler } from '../main/ipc/IPCHandler'
import { DatabaseService } from '../main/database/DatabaseService'
import { CreateMemoInput, UpdateMemoInput, IPCResponse } from '../shared/types'

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  },
  app: {
    getPath: jest.fn(() => '/mock/path')
  }
}))

// Mock database service
const mockDatabaseService = {
  initialize: jest.fn(),
  close: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  createMemo: jest.fn(),
  getMemoById: jest.fn(),
  getAllMemos: jest.fn(),
  updateMemo: jest.fn(),
  deleteMemo: jest.fn(),
  getMemoCount: jest.fn()
}

// Test environment setup
let ipcHandler: IPCHandler

describe('IPC Communication Layer', () => {
  beforeAll(async () => {
    // Initialize IPC handler with mock database service
    ipcHandler = new IPCHandler(mockDatabaseService as any)
    await ipcHandler.initialize()
  })

  afterAll(async () => {
    await ipcHandler.cleanup()
  })

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  describe('Context Isolation & Security', () => {
    test('should create secure browser window with context isolation', () => {
      // GIVEN: Window creation function
      const createSecureWindow = () => {
        return new BrowserWindow({
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: '/path/to/preload.js'
          }
        })
      }
      
      // WHEN: Creating window
      const window = createSecureWindow()
      
      // THEN: Should have secure settings
      expect(window.webPreferences.contextIsolation).toBe(true)
      expect(window.webPreferences.nodeIntegration).toBe(false)
      expect(window.webPreferences.preload).toContain('preload.js')
    })

    test('should register all required IPC channels', () => {
      // GIVEN: IPC handler initialized
      // WHEN: Checking registered channels
      const expectedChannels = [
        'memo:create',
        'memo:getById', 
        'memo:getAll',
        'memo:update',
        'memo:delete',
        'memo:getCount'
      ]
      
      // THEN: All channels should be registered
      expectedChannels.forEach(channel => {
        expect(ipcMain.handle).toHaveBeenCalledWith(
          channel,
          expect.any(Function)
        )
      })
    })

    test('should validate IPC channel security', () => {
      // GIVEN: IPC handler with security validation
      // WHEN: Attempting to register unauthorized channel
      const unauthorizedChannel = 'unauthorized:access'
      
      // THEN: Should prevent unauthorized channels
      expect(() => {
        ipcHandler.registerChannel(unauthorizedChannel, () => {})
      }).toThrow('Unauthorized IPC channel')
    })
  })

  describe('Memo CRUD IPC Operations', () => {
    test('should handle memo creation via IPC', async () => {
      // GIVEN: Valid memo input
      const input: CreateMemoInput = {
        content: 'Test memo',
        x: 100,
        y: 200,
        width: 300,
        height: 200
      }

      const mockMemo = {
        id: 'test-id',
        content: input.content,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDatabaseService.createMemo.mockResolvedValue(mockMemo)
      
      // WHEN: Creating memo via IPC
      const response = await ipcHandler.handleMemoCreate({}, input)
      
      // THEN: Should return successful response
      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockMemo)
      expect(response.timestamp).toBeDefined()
      expect(mockDatabaseService.createMemo).toHaveBeenCalledWith(input)
    })

    test('should handle memo creation validation errors', async () => {
      // GIVEN: Invalid memo input
      const input = {
        content: 'Test memo'
        // Missing required x, y coordinates
      }
      
      const validationError = new Error('Validation error: x position is required')
      mockDatabaseService.createMemo.mockRejectedValue(validationError)
      
      // WHEN: Creating memo via IPC
      const response = await ipcHandler.handleMemoCreate({}, input as any)
      
      // THEN: Should return error response
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error.code).toBe('VALIDATION_ERROR')
      expect(response.error.message).toContain('required')
    })

    test('should handle get memo by ID via IPC', async () => {
      // GIVEN: Existing memo ID
      const memoId = 'existing-memo-id'
      const mockMemo = {
        id: memoId,
        content: 'Test memo',
        x: 100,
        y: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDatabaseService.getMemoById.mockResolvedValue(mockMemo)
      
      // WHEN: Getting memo by ID
      const response = await ipcHandler.handleMemoGetById({}, memoId)
      
      // THEN: Should return memo data
      expect(response.success).toBe(true)
      expect(response.data).toEqual(mockMemo)
      expect(mockDatabaseService.getMemoById).toHaveBeenCalledWith(memoId)
    })

    test('should handle memo not found case', async () => {
      // GIVEN: Non-existent memo ID
      const nonExistentId = 'non-existent-id'
      mockDatabaseService.getMemoById.mockResolvedValue(null)
      
      // WHEN: Getting memo by ID
      const response = await ipcHandler.handleMemoGetById({}, nonExistentId)
      
      // THEN: Should return success with null data
      expect(response.success).toBe(true)
      expect(response.data).toBeNull()
    })

    test('should handle get all memos via IPC', async () => {
      // GIVEN: Database with memos
      const mockMemos = [
        {
          id: 'memo1',
          content: 'First memo',
          x: 100,
          y: 200,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'memo2', 
          content: 'Second memo',
          x: 300,
          y: 400,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockDatabaseService.getAllMemos.mockResolvedValue(mockMemos)
      
      // WHEN: Getting all memos
      const response = await ipcHandler.handleMemoGetAll({})
      
      // THEN: Should return array of memos
      expect(response.success).toBe(true)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data).toEqual(mockMemos)
      expect(mockDatabaseService.getAllMemos).toHaveBeenCalled()
    })

    test('should handle memo update via IPC', async () => {
      // GIVEN: Existing memo and update data
      const memoId = 'existing-memo-id'
      const updateInput: UpdateMemoInput = {
        content: 'Updated content',
        priority: 5
      }

      const updatedMemo = {
        id: memoId,
        content: updateInput.content,
        priority: updateInput.priority,
        x: 100,
        y: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockDatabaseService.updateMemo.mockResolvedValue(updatedMemo)
      
      // WHEN: Updating memo
      const response = await ipcHandler.handleMemoUpdate({}, { id: memoId, ...updateInput })
      
      // THEN: Should return updated memo
      expect(response.success).toBe(true)
      expect(response.data).toEqual(updatedMemo)
      expect(mockDatabaseService.updateMemo).toHaveBeenCalledWith(memoId, updateInput)
    })

    test('should handle memo deletion via IPC', async () => {
      // GIVEN: Existing memo ID
      const memoId = 'existing-memo-id'
      mockDatabaseService.deleteMemo.mockResolvedValue(undefined)
      
      // WHEN: Deleting memo
      const response = await ipcHandler.handleMemoDelete({}, memoId)
      
      // THEN: Should return success
      expect(response.success).toBe(true)
      expect(response.data).toBeUndefined()
      expect(mockDatabaseService.deleteMemo).toHaveBeenCalledWith(memoId)
    })

    test('should handle memo count request via IPC', async () => {
      // GIVEN: Database with memo count
      const mockCount = 5
      mockDatabaseService.getMemoCount.mockResolvedValue(mockCount)
      
      // WHEN: Getting memo count
      const response = await ipcHandler.handleMemoGetCount({})
      
      // THEN: Should return count
      expect(response.success).toBe(true)
      expect(response.data).toBe(mockCount)
      expect(mockDatabaseService.getMemoCount).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // GIVEN: Database service unavailable
      const dbError = new Error('Database connection failed')
      mockDatabaseService.getAllMemos.mockRejectedValue(dbError)
      
      // WHEN: Attempting memo operation
      const response = await ipcHandler.handleMemoGetAll({})
      
      // THEN: Should return structured error
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error.code).toBe('DATABASE_ERROR')
      expect(response.error.message).toContain('database')
    })

    test('should sanitize error messages for security', async () => {
      // GIVEN: Database error with sensitive details
      const sensitiveError = new Error('Connection failed: /Users/user/sensitive/path/database.db')
      mockDatabaseService.createMemo.mockRejectedValue(sensitiveError)
      
      // WHEN: Creating memo fails
      const response = await ipcHandler.handleMemoCreate({}, {
        content: 'test',
        x: 0,
        y: 0
      })
      
      // THEN: Error should not contain sensitive paths
      expect(response.success).toBe(false)
      expect(response.error.message).not.toContain('/Users/user/sensitive')
      expect(response.error.message).not.toContain('database.db')
    })

    test('should log errors appropriately', async () => {
      // GIVEN: Error logging spy
      const logSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // WHEN: IPC operation fails
      const dbError = new Error('Database operation failed')
      mockDatabaseService.createMemo.mockRejectedValue(dbError)
      
      await ipcHandler.handleMemoCreate({}, {
        content: 'test',
        x: 0,
        y: 0
      })
      
      // THEN: Error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('IPC Error:'),
        expect.objectContaining({
          channel: 'memo:create',
          error: dbError
        })
      )
      
      logSpy.mockRestore()
    })
  })

  describe('Response Format Consistency', () => {
    test('should return consistent format for successful responses', async () => {
      // GIVEN: Successful database operation
      mockDatabaseService.getAllMemos.mockResolvedValue([])
      
      // WHEN: Making IPC request
      const response = await ipcHandler.handleMemoGetAll({})
      
      // THEN: Should have consistent success format
      expect(response).toMatchObject({
        success: true,
        data: expect.any(Array),
        timestamp: expect.any(Number)
      })
      expect(response.error).toBeUndefined()
    })

    test('should return consistent format for error responses', async () => {
      // GIVEN: Database operation that will fail
      const dbError = new Error('Database operation failed')
      mockDatabaseService.getAllMemos.mockRejectedValue(dbError)
      
      // WHEN: Making IPC request
      const response = await ipcHandler.handleMemoGetAll({})
      
      // THEN: Should have consistent error format
      expect(response).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String)
        },
        timestamp: expect.any(Number)
      })
      expect(response.data).toBeUndefined()
    })

    test('should include accurate timestamps in responses', async () => {
      // GIVEN: Current time before request
      const beforeTime = Date.now()
      mockDatabaseService.getAllMemos.mockResolvedValue([])
      
      // WHEN: Making IPC request
      const response = await ipcHandler.handleMemoGetAll({})
      const afterTime = Date.now()
      
      // THEN: Timestamp should be recent
      expect(response.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(response.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Performance', () => {
    test('should complete IPC operations efficiently', async () => {
      // GIVEN: Mock database responses
      mockDatabaseService.getAllMemos.mockResolvedValue([])
      mockDatabaseService.getMemoCount.mockResolvedValue(0)
      mockDatabaseService.getMemoById.mockResolvedValue(null)
      
      // WHEN: Testing operation performance
      const operations = [
        () => ipcHandler.handleMemoGetAll({}),
        () => ipcHandler.handleMemoGetCount({}),
        () => ipcHandler.handleMemoGetById({}, 'test-id')
      ]
      
      // THEN: Each operation should complete quickly
      for (const operation of operations) {
        const startTime = performance.now()
        await operation()
        const endTime = performance.now()
        
        expect(endTime - startTime).toBeLessThan(50) // 50ms limit
      }
    })
  })
})