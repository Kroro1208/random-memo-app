/**
 * Memo Store Tests
 * Testing Zustand store functionality with license-aware features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMemoStore } from './memoStore'
import { Memo, CreateMemoInput, IPCResponse } from '../../shared/types'

// Mock the global electronAPI
const mockElectronAPI = {
  memos: {
    create: vi.fn(),
    getAll: vi.fn(), 
    update: vi.fn(),
    delete: vi.fn(),
    getCount: vi.fn()
  },
  license: {
    getInfo: vi.fn(),
    getLimitStatus: vi.fn(),
    canCreateMemo: vi.fn()
  }
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

describe('MemoStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMemoStore.setState({
      memos: [],
      selectedMemoId: null,
      isLoading: false,
      error: null,
      license: null,
      memoLimitStatus: null,
      isDragging: false,
      dragOffset: null
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Memo CRUD Operations', () => {
    it('should create memo successfully', async () => {
      // Arrange
      const input: CreateMemoInput = {
        content: 'Test memo',
        x: 100,
        y: 200
      }

      const mockMemo: Memo = {
        id: 'test-id',
        content: 'Test memo',
        x: 100,
        y: 200,
        width: 200,
        height: 150,
        opacity: 1,
        alwaysOnTop: false,
        pinned: false,
        priority: 3,
        backgroundColor: '#ffeb3b',
        textColor: '#333333',
        fontSize: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }

      const mockResponse: IPCResponse<Memo> = {
        success: true,
        data: mockMemo,
        timestamp: Date.now()
      }

      // Mock license check to allow creation
      mockElectronAPI.license.canCreateMemo.mockResolvedValue({
        success: true,
        data: true,
        timestamp: Date.now()
      })

      mockElectronAPI.memos.create.mockResolvedValue(mockResponse)

      // Act
      await useMemoStore.getState().actions.createMemo(input)

      // Assert
      const state = useMemoStore.getState()
      expect(state.memos).toHaveLength(1)
      expect(state.memos[0]).toEqual(mockMemo)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(mockElectronAPI.memos.create).toHaveBeenCalledWith(input)
    })

    it('should handle memo creation failure due to license limit', async () => {
      // Arrange
      const input: CreateMemoInput = {
        content: 'Test memo',
        x: 100,
        y: 200
      }

      // Mock license check to deny creation
      mockElectronAPI.license.canCreateMemo.mockResolvedValue({
        success: true,
        data: false,
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.createMemo(input)

      // Assert
      const state = useMemoStore.getState()
      expect(state.memos).toHaveLength(0)
      expect(state.error).toBe('Memo limit reached. Upgrade to create more memos.')
      expect(mockElectronAPI.memos.create).not.toHaveBeenCalled()
    })

    it('should get all memos successfully', async () => {
      // Arrange
      const mockMemos: Memo[] = [
        {
          id: 'memo-1',
          content: 'First memo',
          x: 100,
          y: 200,
          width: 200,
          height: 150,
          opacity: 1,
          alwaysOnTop: false,
          pinned: false,
          priority: 3,
          backgroundColor: '#ffeb3b',
          textColor: '#333333',
          fontSize: 14,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false
        }
      ]

      mockElectronAPI.memos.getAll.mockResolvedValue({
        success: true,
        data: mockMemos,
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.getMemos()

      // Assert
      const state = useMemoStore.getState()
      expect(state.memos).toEqual(mockMemos)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should update memo successfully', async () => {
      // Arrange
      const existingMemo: Memo = {
        id: 'memo-1',
        content: 'Original content',
        x: 100,
        y: 200,
        width: 200,
        height: 150,
        opacity: 1,
        alwaysOnTop: false,
        pinned: false,
        priority: 3,
        backgroundColor: '#ffeb3b',
        textColor: '#333333',
        fontSize: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }

      useMemoStore.setState({ memos: [existingMemo] })

      const updatedMemo: Memo = {
        ...existingMemo,
        content: 'Updated content'
      }

      mockElectronAPI.memos.update.mockResolvedValue({
        success: true,
        data: updatedMemo,
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.updateMemo('memo-1', { content: 'Updated content' })

      // Assert
      const state = useMemoStore.getState()
      expect(state.memos[0].content).toBe('Updated content')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should delete memo successfully', async () => {
      // Arrange
      const existingMemo: Memo = {
        id: 'memo-1',
        content: 'To be deleted',
        x: 100,
        y: 200,
        width: 200,
        height: 150,
        opacity: 1,
        alwaysOnTop: false,
        pinned: false,
        priority: 3,
        backgroundColor: '#ffeb3b',
        textColor: '#333333',
        fontSize: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }

      useMemoStore.setState({ 
        memos: [existingMemo],
        selectedMemoId: 'memo-1'
      })

      mockElectronAPI.memos.delete.mockResolvedValue({
        success: true,
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.deleteMemo('memo-1')

      // Assert
      const state = useMemoStore.getState()
      expect(state.memos).toHaveLength(0)
      expect(state.selectedMemoId).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('License Integration', () => {
    it('should refresh license status', async () => {
      // Arrange
      const mockLicense = {
        licenseKey: 'test-key',
        licenseType: 'standard',
        isValid: true,
        deviceId: 'device-123'
      }

      const mockLimitStatus = {
        currentCount: 5,
        maxCount: 10,
        canCreate: true,
        remainingSlots: 5,
        nearLimit: false
      }

      mockElectronAPI.license.getInfo.mockResolvedValue({
        success: true,
        data: mockLicense,
        timestamp: Date.now()
      })

      mockElectronAPI.license.getLimitStatus.mockResolvedValue({
        success: true,
        data: mockLimitStatus,
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.refreshLicenseStatus()

      // Assert
      const state = useMemoStore.getState()
      expect(state.license).toEqual(mockLicense)
      expect(state.memoLimitStatus).toEqual(mockLimitStatus)
    })

    it('should check if can create memo', async () => {
      // Arrange
      mockElectronAPI.license.canCreateMemo.mockResolvedValue({
        success: true,
        data: true,
        timestamp: Date.now()
      })

      // Act
      const canCreate = await useMemoStore.getState().actions.checkCanCreateMemo()

      // Assert
      expect(canCreate).toBe(true)
      expect(mockElectronAPI.license.canCreateMemo).toHaveBeenCalled()
    })
  })

  describe('UI State Management', () => {
    it('should select memo', () => {
      // Act
      useMemoStore.getState().actions.selectMemo('memo-123')

      // Assert
      const state = useMemoStore.getState()
      expect(state.selectedMemoId).toBe('memo-123')
    })

    it('should set dragging state', () => {
      // Act
      useMemoStore.getState().actions.setDragging(true, { x: 10, y: 20 })

      // Assert
      const state = useMemoStore.getState()
      expect(state.isDragging).toBe(true)
      expect(state.dragOffset).toEqual({ x: 10, y: 20 })
    })

    it('should clear error', () => {
      // Arrange
      useMemoStore.setState({ error: 'Test error' })

      // Act
      useMemoStore.getState().actions.clearError()

      // Assert
      const state = useMemoStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle IPC errors gracefully', async () => {
      // Arrange
      mockElectronAPI.memos.getAll.mockResolvedValue({
        success: false,
        error: { message: 'Database connection failed' },
        timestamp: Date.now()
      })

      // Act
      await useMemoStore.getState().actions.getMemos()

      // Assert
      const state = useMemoStore.getState()
      expect(state.error).toBe('Database connection failed')
      expect(state.isLoading).toBe(false)
    })
  })
})