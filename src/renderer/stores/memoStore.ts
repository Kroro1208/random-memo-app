/**
 * Memo Store - Zustand store for memo management
 * 
 * This store manages memo state with CRUD operations and license-aware functionality.
 * Integrates with the IPC layer for communication with the main process.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Memo, CreateMemoInput, UpdateMemoInput, IPCResponse, License, MemoLimitStatus } from '../../shared/types'

/**
 * Memo store state interface
 */
export interface MemoStoreState {
  // Memo data
  memos: Memo[]
  selectedMemoId: string | null
  isLoading: boolean
  error: string | null

  // License-aware state
  license: License | null
  memoLimitStatus: MemoLimitStatus | null
  
  // UI state
  isDragging: boolean
  dragOffset: { x: number; y: number } | null
  
  // Actions
  actions: {
    // Memo CRUD operations
    createMemo: (input: CreateMemoInput) => Promise<void>
    getMemos: () => Promise<void>
    updateMemo: (id: string, input: UpdateMemoInput) => Promise<void>
    deleteMemo: (id: string) => Promise<void>
    
    // License operations
    refreshLicenseStatus: () => Promise<void>
    checkCanCreateMemo: () => Promise<boolean>
    
    // UI operations
    selectMemo: (id: string | null) => void
    setDragging: (isDragging: boolean, offset?: { x: number; y: number }) => void
    clearError: () => void
    
    // Initialization
    initialize: () => Promise<void>
  }
}

/**
 * Create the memo store with Zustand and Immer for immutable state updates
 */
export const useMemoStore = create<MemoStoreState>()(
  immer((set, get) => ({
    // Initial state
    memos: [],
    selectedMemoId: null,
    isLoading: false,
    error: null,
    license: null,
    memoLimitStatus: null,
    isDragging: false,
    dragOffset: null,

    // Actions
    actions: {
      /**
       * Create a new memo
       */
      createMemo: async (input: CreateMemoInput) => {
        try {
          // Check if we can create more memos (license limit)
          const canCreate = await get().actions.checkCanCreateMemo()
          if (!canCreate) {
            set(state => {
              state.error = 'Memo limit reached. Upgrade to create more memos.'
            })
            return
          }

          set(state => {
            state.isLoading = true
            state.error = null
          })

          // Call IPC to create memo
          const response: IPCResponse<Memo> = await window.electronAPI.memos.create(input)
          
          if (response.success && response.data) {
            set(state => {
              state.memos.push(response.data!)
              state.isLoading = false
            })
            
            // Refresh limit status after creation
            await get().actions.refreshLicenseStatus()
          } else {
            throw new Error(response.error?.message || 'Failed to create memo')
          }
        } catch (error) {
          set(state => {
            state.isLoading = false
            state.error = error instanceof Error ? error.message : 'Unknown error occurred'
          })
        }
      },

      /**
       * Get all memos from the database
       */
      getMemos: async () => {
        try {
          set(state => {
            state.isLoading = true
            state.error = null
          })

          const response: IPCResponse<Memo[]> = await window.electronAPI.memos.getAll()
          
          if (response.success && response.data) {
            set(state => {
              state.memos = response.data!
              state.isLoading = false
            })
          } else {
            throw new Error(response.error?.message || 'Failed to get memos')
          }
        } catch (error) {
          set(state => {
            state.isLoading = false
            state.error = error instanceof Error ? error.message : 'Unknown error occurred'
          })
        }
      },

      /**
       * Update an existing memo
       */
      updateMemo: async (id: string, input: UpdateMemoInput) => {
        try {
          set(state => {
            state.isLoading = true
            state.error = null
          })

          const response: IPCResponse<Memo> = await window.electronAPI.memos.update(id, input)
          
          if (response.success && response.data) {
            set(state => {
              const index = state.memos.findIndex(memo => memo.id === id)
              if (index !== -1) {
                state.memos[index] = response.data!
              }
              state.isLoading = false
            })
          } else {
            throw new Error(response.error?.message || 'Failed to update memo')
          }
        } catch (error) {
          set(state => {
            state.isLoading = false
            state.error = error instanceof Error ? error.message : 'Unknown error occurred'
          })
        }
      },

      /**
       * Delete a memo
       */
      deleteMemo: async (id: string) => {
        try {
          set(state => {
            state.isLoading = true
            state.error = null
          })

          const response: IPCResponse = await window.electronAPI.memos.delete(id)
          
          if (response.success) {
            set(state => {
              state.memos = state.memos.filter(memo => memo.id !== id)
              if (state.selectedMemoId === id) {
                state.selectedMemoId = null
              }
              state.isLoading = false
            })
            
            // Refresh limit status after deletion
            await get().actions.refreshLicenseStatus()
          } else {
            throw new Error(response.error?.message || 'Failed to delete memo')
          }
        } catch (error) {
          set(state => {
            state.isLoading = false
            state.error = error instanceof Error ? error.message : 'Unknown error occurred'
          })
        }
      },

      /**
       * Refresh license status and memo limits
       */
      refreshLicenseStatus: async () => {
        try {
          // Get current license info
          const licenseResponse = await window.electronAPI.license?.getInfo?.()
          if (licenseResponse?.success && licenseResponse.data) {
            set(state => {
              state.license = licenseResponse.data!
            })
          }

          // Get memo limit status
          const limitResponse = await window.electronAPI.license?.getLimitStatus?.()
          if (limitResponse?.success && limitResponse.data) {
            set(state => {
              state.memoLimitStatus = limitResponse.data!
            })
          }
        } catch (error) {
          console.warn('Failed to refresh license status:', error)
          // Don't set error state as this is a background operation
        }
      },

      /**
       * Check if we can create more memos (license limit check)
       */
      checkCanCreateMemo: async (): Promise<boolean> => {
        try {
          const response = await window.electronAPI.license?.canCreateMemo?.()
          return response?.success && response.data === true
        } catch (error) {
          console.warn('Failed to check memo creation ability:', error)
          return false // Conservative fallback
        }
      },

      /**
       * Select a memo by ID
       */
      selectMemo: (id: string | null) => {
        set(state => {
          state.selectedMemoId = id
        })
      },

      /**
       * Set dragging state for memo positioning
       */
      setDragging: (isDragging: boolean, offset?: { x: number; y: number }) => {
        set(state => {
          state.isDragging = isDragging
          state.dragOffset = offset || null
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
       * Initialize the store - load memos and license status
       */
      initialize: async () => {
        await Promise.all([
          get().actions.getMemos(),
          get().actions.refreshLicenseStatus()
        ])
      }
    }
  }))
)

/**
 * Helper hooks for accessing specific parts of the store
 */

// Hook for memo data
export const useMemos = () => useMemoStore(state => ({
  memos: state.memos,
  selectedMemoId: state.selectedMemoId,
  isLoading: state.isLoading,
  error: state.error
}))

// Hook for license-aware functionality  
export const useLicense = () => useMemoStore(state => ({
  license: state.license,
  memoLimitStatus: state.memoLimitStatus,
  canCreateMemo: state.memoLimitStatus?.canCreate ?? false,
  remainingSlots: state.memoLimitStatus?.remainingSlots ?? 0,
  nearLimit: state.memoLimitStatus?.nearLimit ?? false
}))

// Hook for UI state
export const useUIState = () => useMemoStore(state => ({
  isDragging: state.isDragging,
  dragOffset: state.dragOffset
}))

// Hook for actions
export const useMemoActions = () => useMemoStore(state => state.actions)