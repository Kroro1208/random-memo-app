import { PrismaClient } from '@prisma/client'
import { CreateMemoInput, UpdateMemoInput, Memo } from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Validation rules constants
 */
const VALIDATION_RULES = {
  CONTENT_MAX_LENGTH: 10000,
  OPACITY_MIN: 0,
  OPACITY_MAX: 1,
  PRIORITY_MIN: 1,
  PRIORITY_MAX: 5,
  FONT_SIZE_MIN: 8,
  FONT_SIZE_MAX: 72,
  TAG_MAX_LENGTH: 100,
  HEX_COLOR_PATTERN: /^#[0-9a-fA-F]{6}$/
} as const

/**
 * Default memo values
 */
const DEFAULT_MEMO_VALUES = {
  WIDTH: 200,
  HEIGHT: 150,
  OPACITY: 1.0,
  PRIORITY: 3,
  BACKGROUND_COLOR: '#ffeb3b',
  TEXT_COLOR: '#333333',
  FONT_SIZE: 14,
  ALWAYS_ON_TOP: false,
  PINNED: false
} as const

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  databaseUrl?: string
  retryAttempts?: number
  retryDelay?: number
}

/**
 * Database error codes
 */
export enum DatabaseErrorCode {
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  INIT_FAILED = 'INIT_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CREATE_FAILED = 'CREATE_FAILED',
  READ_FAILED = 'READ_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  COUNT_FAILED = 'COUNT_FAILED'
}

/**
 * Database error class for structured error handling
 */
export class DatabaseError extends Error {
  constructor(
    public code: DatabaseErrorCode | string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Database service class for handling all data persistence operations
 * 
 * This service provides a high-level interface for memo CRUD operations,
 * transaction support, and proper error handling using Prisma ORM with SQLite.
 */
export class DatabaseService {
  private prisma: PrismaClient | null = null
  private config: DatabaseConfig
  private isInitialized: boolean = false

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 100,
      ...config
    }
  }

  /**
   * Initialize the database connection and run migrations
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Prisma client
      const databaseUrl = this.config.databaseUrl || process.env.DATABASE_URL || 'file:./prisma/memo-app.db'
      
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      })

      // Test the connection
      await this.prisma.$connect()
      
      // Ensure tables exist by running a simple query
      try {
        await this.prisma.memo.findMany({ take: 1 })
      } catch (error) {
        // If tables don't exist, that's expected in development
        // In production, migrations would handle this
      }

      this.isInitialized = true
    } catch (error) {
      throw new DatabaseError('INIT_FAILED', 'Database initialization failed', error)
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect()
        this.prisma = null
      }
      this.isInitialized = false
    } catch (error) {
      throw new DatabaseError('CLOSE_FAILED', 'Database close failed', error)
    }
  }

  /**
   * Check if the database connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.prisma || !this.isInitialized) {
        return false
      }
      
      // Perform a simple query to check connectivity
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Create a new memo
   */
  async createMemo(input: CreateMemoInput): Promise<Memo> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      // Validate input
      this.validateMemoInput(input)

      const now = new Date()
      const memoData = {
        id: uuidv4(),
        content: this.sanitizeContent(input.content || ''),
        x: input.x,
        y: input.y,
        width: input.width ?? DEFAULT_MEMO_VALUES.WIDTH,
        height: input.height ?? DEFAULT_MEMO_VALUES.HEIGHT,
        opacity: input.opacity ?? DEFAULT_MEMO_VALUES.OPACITY,
        alwaysOnTop: DEFAULT_MEMO_VALUES.ALWAYS_ON_TOP,
        pinned: DEFAULT_MEMO_VALUES.PINNED,
        priority: input.priority ?? DEFAULT_MEMO_VALUES.PRIORITY,
        backgroundColor: input.backgroundColor ?? DEFAULT_MEMO_VALUES.BACKGROUND_COLOR,
        textColor: input.textColor ?? DEFAULT_MEMO_VALUES.TEXT_COLOR,
        fontSize: input.fontSize ?? DEFAULT_MEMO_VALUES.FONT_SIZE,
        dueDate: input.dueDate || null,
        tags: JSON.stringify(input.tags || []),
        createdAt: now,
        updatedAt: now,
        isDeleted: false
      }

      const created = await this.prisma.memo.create({
        data: memoData
      })

      return this.recordToMemo(created)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('CREATE_FAILED', 'Failed to create memo', error)
    }
  }

  /**
   * Get memo by ID
   */
  async getMemoById(id: string, options?: { includeDeleted?: boolean }): Promise<Memo | null> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      const where: any = { id }
      if (!options?.includeDeleted) {
        where.isDeleted = false
      }

      const record = await this.prisma.memo.findFirst({
        where
      })

      if (!record) {
        return null
      }

      return this.recordToMemo(record)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('READ_FAILED', 'Failed to get memo', error)
    }
  }

  /**
   * Get all memos (non-deleted by default)
   */
  async getAllMemos(): Promise<Memo[]> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      const records = await this.prisma.memo.findMany({
        where: {
          isDeleted: false
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      return records.map(record => this.recordToMemo(record))
    } catch (error) {
      throw new DatabaseError('READ_FAILED', 'Failed to get all memos', error)
    }
  }

  /**
   * Update memo
   */
  async updateMemo(id: string, input: UpdateMemoInput): Promise<Memo> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      // Check if memo exists
      const existingMemo = await this.prisma.memo.findFirst({
        where: { id, isDeleted: false }
      })

      if (!existingMemo) {
        throw new DatabaseError('NOT_FOUND', 'Memo not found')
      }

      // Validate input
      this.validateMemoInput(input)

      const updateData: any = {
        updatedAt: new Date()
      }

      // Only update provided fields
      if (input.content !== undefined) {
        updateData.content = this.sanitizeContent(input.content)
      }
      if (input.x !== undefined) updateData.x = input.x
      if (input.y !== undefined) updateData.y = input.y
      if (input.width !== undefined) updateData.width = input.width
      if (input.height !== undefined) updateData.height = input.height
      if (input.opacity !== undefined) updateData.opacity = input.opacity
      if (input.alwaysOnTop !== undefined) updateData.alwaysOnTop = input.alwaysOnTop
      if (input.pinned !== undefined) updateData.pinned = input.pinned
      if (input.priority !== undefined) updateData.priority = input.priority
      if (input.backgroundColor !== undefined) updateData.backgroundColor = input.backgroundColor
      if (input.textColor !== undefined) updateData.textColor = input.textColor
      if (input.fontSize !== undefined) updateData.fontSize = input.fontSize
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate
      if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags)

      const updated = await this.prisma.memo.update({
        where: { id },
        data: updateData
      })

      return this.recordToMemo(updated)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('UPDATE_FAILED', 'Failed to update memo', error)
    }
  }

  /**
   * Delete memo (soft delete)
   */
  async deleteMemo(id: string): Promise<void> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      // Check if memo exists
      const existingMemo = await this.prisma.memo.findFirst({
        where: { id, isDeleted: false }
      })

      if (!existingMemo) {
        throw new DatabaseError('NOT_FOUND', 'Memo not found')
      }

      // Soft delete
      await this.prisma.memo.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError('DELETE_FAILED', 'Failed to delete memo', error)
    }
  }

  /**
   * Get count of active memos
   */
  async getMemoCount(): Promise<number> {
    try {
      if (!this.prisma) {
        throw new DatabaseError('NOT_INITIALIZED', 'Database service not initialized')
      }

      const count = await this.prisma.memo.count({
        where: {
          isDeleted: false
        }
      })

      return count
    } catch (error) {
      throw new DatabaseError('COUNT_FAILED', 'Failed to count memos', error)
    }
  }

  /**
   * Clear all test data (for testing purposes only)
   */
  async clearAllTestData(): Promise<void> {
    try {
      if (!this.prisma) {
        return
      }

      // Delete all memos (for testing only)
      await this.prisma.memo.deleteMany({})
    } catch (error) {
      // Ignore errors in test cleanup
    }
  }

  // Private helper methods

  /**
   * Validate memo input data
   */
  private validateMemoInput(input: CreateMemoInput | UpdateMemoInput): void {
    // For CreateMemoInput, check required fields
    if ('content' in input && input.content === undefined && 'x' in input) {
      // This is CreateMemoInput, validate required fields
      const createInput = input as CreateMemoInput
      if (createInput.content === undefined && !('id' in input)) {
        throw new DatabaseError('VALIDATION_ERROR', 'Validation error: content is required')
      }
      if (createInput.x === undefined) {
        throw new DatabaseError('VALIDATION_ERROR', 'Validation error: x position is required')
      }
      if (createInput.y === undefined) {
        throw new DatabaseError('VALIDATION_ERROR', 'Validation error: y position is required')
      }
    }

    // Validate data types
    if ('content' in input && input.content !== undefined && typeof input.content !== 'string') {
      throw new DatabaseError('VALIDATION_ERROR', 'Invalid data type: content must be string')
    }
    if ('x' in input && input.x !== undefined && typeof input.x !== 'number') {
      throw new DatabaseError('VALIDATION_ERROR', 'Invalid data type: x must be number')
    }
    if ('y' in input && input.y !== undefined && typeof input.y !== 'number') {
      throw new DatabaseError('VALIDATION_ERROR', 'Invalid data type: y must be number')
    }
    if ('opacity' in input && input.opacity !== undefined && typeof input.opacity !== 'number') {
      throw new DatabaseError('VALIDATION_ERROR', 'Invalid data type: opacity must be number')
    }

    // Validate ranges
    if ('opacity' in input && input.opacity !== undefined) {
      if (input.opacity < 0 || input.opacity > 1) {
        throw new DatabaseError('VALIDATION_ERROR', 'Value out of range: opacity must be between 0 and 1')
      }
    }
    if ('priority' in input && input.priority !== undefined) {
      if (input.priority < 1 || input.priority > 5) {
        throw new DatabaseError('VALIDATION_ERROR', 'Value out of range: priority must be between 1 and 5')
      }
    }
    if ('fontSize' in input && input.fontSize !== undefined) {
      if (input.fontSize < 8 || input.fontSize > 72) {
        throw new DatabaseError('VALIDATION_ERROR', 'Value out of range: fontSize must be between 8 and 72')
      }
    }

    // Validate content length
    if ('content' in input && input.content && input.content.length > 10000) {
      throw new DatabaseError('VALIDATION_ERROR', 'Content exceeds maximum length of 10000 characters')
    }

    // Validate color formats (basic validation)
    if ('backgroundColor' in input && input.backgroundColor) {
      if (!input.backgroundColor.match(/^#[0-9a-fA-F]{6}$/)) {
        throw new DatabaseError('VALIDATION_ERROR', 'Invalid color format: backgroundColor must be hex color (#rrggbb)')
      }
    }
    if ('textColor' in input && input.textColor) {
      if (!input.textColor.match(/^#[0-9a-fA-F]{6}$/)) {
        throw new DatabaseError('VALIDATION_ERROR', 'Invalid color format: textColor must be hex color (#rrggbb)')
      }
    }

    // Validate tags
    if ('tags' in input && input.tags !== undefined) {
      if (!Array.isArray(input.tags)) {
        throw new DatabaseError('VALIDATION_ERROR', 'Invalid tags format: tags must be array')
      }
      for (const tag of input.tags) {
        if (typeof tag !== 'string') {
          throw new DatabaseError('VALIDATION_ERROR', 'Invalid tags format: all tags must be strings')
        }
        if (tag === '') {
          throw new DatabaseError('VALIDATION_ERROR', 'Invalid tags format: tags cannot be empty strings')
        }
        if (tag.length > 100) {
          throw new DatabaseError('VALIDATION_ERROR', 'Invalid tags format: tags cannot exceed 100 characters')
        }
      }
    }
  }

  /**
   * Convert database record to Memo object
   */
  private recordToMemo(record: any): Memo {
    return {
      id: record.id,
      content: record.content,
      x: record.x,
      y: record.y,
      width: record.width,
      height: record.height,
      opacity: record.opacity,
      alwaysOnTop: record.alwaysOnTop,
      pinned: record.pinned,
      priority: record.priority,
      backgroundColor: record.backgroundColor,
      textColor: record.textColor,
      fontSize: record.fontSize,
      dueDate: record.dueDate,
      tags: record.tags ? JSON.parse(record.tags) : [],
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      isDeleted: record.isDeleted
    }
  }

  /**
   * Sanitize text content to prevent injection
   */
  private sanitizeContent(content: string): string {
    if (!content) return ''
    
    // Basic sanitization - remove potentially dangerous content
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/DROP\s+TABLE/gi, '') // Remove SQL injection attempts
      .replace(/DELETE\s+FROM/gi, '') // Remove SQL injection attempts
      .replace(/INSERT\s+INTO/gi, '') // Remove SQL injection attempts
      .replace(/UPDATE\s+SET/gi, '') // Remove SQL injection attempts
      .trim()
  }
}