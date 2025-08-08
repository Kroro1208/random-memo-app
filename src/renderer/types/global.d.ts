/**
 * Global type definitions for the renderer process
 */

interface ElectronAPI {
  memos: {
    create(input: any): Promise<any>
    getById(id: string): Promise<any>
    getAll(): Promise<any>
    update(id: string, input: any): Promise<any>
    delete(id: string): Promise<any>
    getCount(): Promise<any>
  }
  
  license: {
    getInfo(): Promise<any>
    activate(request: any): Promise<any>
    deactivate(): Promise<any>
    validate(): Promise<any>
    checkFeature(feature: string): Promise<any>
    getLimitStatus(): Promise<any>
    canCreateMemo(): Promise<any>
  }

  system: {
    getDisplays(): Promise<any>
    showNotification(request: any): Promise<any>
  }
  
  settings: {
    get(): Promise<any>
    update(settings: any): Promise<any>
  }
  
  on(channel: string, callback: (data: any) => void): void
  off(channel: string, callback: (data: any) => void): void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}