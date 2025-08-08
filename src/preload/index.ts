import { contextBridge, ipcRenderer } from 'electron'
import { CreateMemoInput, UpdateMemoInput, IPCResponse, IPC_CHANNELS } from '../shared/types'

/**
 * Electron API interface exposed to renderer process
 */
interface ElectronAPI {
  // Memo operations
  memos: {
    create(input: CreateMemoInput): Promise<IPCResponse>
    getById(id: string): Promise<IPCResponse>
    getAll(): Promise<IPCResponse>
    update(id: string, input: UpdateMemoInput): Promise<IPCResponse>
    delete(id: string): Promise<IPCResponse>
    getCount(): Promise<IPCResponse>
  }
  
  // System operations
  system: {
    getDisplays(): Promise<IPCResponse>
    showNotification(request: any): Promise<IPCResponse>
  }
  
  // Settings operations
  settings: {
    get(): Promise<IPCResponse>
    update(settings: any): Promise<IPCResponse>
  }
  
  // Event listeners
  on(channel: string, callback: (data: any) => void): void
  off(channel: string, callback: (data: any) => void): void
}

/**
 * Create secure API for renderer process
 */
const electronAPI: ElectronAPI = {
  // Memo operations
  memos: {
    async create(input: CreateMemoInput): Promise<IPCResponse> {
      // Validate input parameters
      if (!input) {
        throw new Error('Invalid parameters: input is required')
      }
      if (!input.content && input.content !== '') {
        throw new Error('Invalid parameters: content is required')
      }
      if (input.x === undefined || input.y === undefined) {
        throw new Error('Invalid parameters: x and y coordinates are required')
      }
      
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_CREATE, input)
    },

    async getById(id: string): Promise<IPCResponse> {
      // Validate ID parameter
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid parameters: id is required and must be non-empty string')
      }
      
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_GET_BY_ID, id)
    },

    async getAll(): Promise<IPCResponse> {
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_GET_ALL)
    },

    async update(id: string, input: UpdateMemoInput): Promise<IPCResponse> {
      // Validate parameters
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid parameters: id is required and must be string')
      }
      if (!input || typeof input !== 'object') {
        throw new Error('Invalid parameters: input is required and must be object')
      }
      
      // Call IPC invoke with separate id and input
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_UPDATE, { id, ...input })
    },

    async delete(id: string): Promise<IPCResponse> {
      // Validate ID parameter
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid parameters: id is required and must be non-empty string')
      }
      
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_DELETE, id)
    },

    async getCount(): Promise<IPCResponse> {
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.MEMO_GET_COUNT)
    }
  },

  // System operations
  system: {
    async getDisplays(): Promise<IPCResponse> {
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_DISPLAYS)
    },

    async showNotification(request: any): Promise<IPCResponse> {
      // Validate request
      if (!request || typeof request !== 'object') {
        throw new Error('Invalid parameters: request is required and must be object')
      }
      
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, request)
    }
  },

  // Settings operations
  settings: {
    async get(): Promise<IPCResponse> {
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET)
    },

    async update(settings: any): Promise<IPCResponse> {
      // Validate settings
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid parameters: settings is required and must be object')
      }
      
      // Call IPC invoke
      return await ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings)
    }
  },

  // Event listeners
  on(channel: string, callback: (data: any) => void): void {
    // Validate channel
    if (!channel || typeof channel !== 'string') {
      throw new Error('Invalid channel: must be non-empty string')
    }
    if (typeof callback !== 'function') {
      throw new Error('Invalid callback: must be function')
    }
    
    // Register event listener
    ipcRenderer.on(channel, (_event, data) => callback(data))
  },

  off(channel: string, callback: (data: any) => void): void {
    // Validate channel
    if (!channel || typeof channel !== 'string') {
      throw new Error('Invalid channel: must be non-empty string')
    }
    if (typeof callback !== 'function') {
      throw new Error('Invalid callback: must be function')
    }
    
    // Remove event listener
    ipcRenderer.removeListener(channel, callback)
  }
}

/**
 * Expose the API to renderer process via context bridge
 */
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
} catch (error) {
  console.error('Failed to expose electron API:', error)
}

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}