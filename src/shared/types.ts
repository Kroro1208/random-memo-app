/**
 * Shared types for the Random Memo App
 * Used by both main and renderer processes
 */

// Re-export design document types
export * from '../../docs/design/desktop-memo-app/interfaces';

// Additional runtime types
export interface AppInfo {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  arch: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppConfig {
  isDev: boolean;
  userDataPath: string;
  resourcesPath: string;
}

export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  version: string;
  displays: DisplayInfo[];
}