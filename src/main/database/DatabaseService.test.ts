import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { DatabaseService } from './DatabaseService'
import { CreateMemoInput } from '../../shared/types'
import * as fs from 'fs'
import * as path from 'path'

// Test database service instance
let dbService: DatabaseService

// Test configuration
const TEST_DB_PATH = path.join(process.cwd(), 'test-memo-app.db')

describe('DatabaseService', () => {
  beforeAll(async () => {
    // Remove existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    
    // Initialize test database service
    dbService = new DatabaseService({
      databaseUrl: `file:${TEST_DB_PATH}`
    })
    await dbService.initialize()
  })

  afterAll(async () => {
    // Clean up test database
    if (dbService) {
      await dbService.close()
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  beforeEach(async () => {
    // Clear all test data before each test
    await dbService.clearAllTestData()
  })

  describe('Initialization', () => {
    test('should initialize database service successfully', async () => {
      // GIVEN: Fresh database service instance
      const testDbService = new DatabaseService({
        databaseUrl: `file:${TEST_DB_PATH}-init-test`
      })
      
      // WHEN: Initialize is called
      await testDbService.initialize()
      
      // THEN: Service should be ready and database should exist
      expect(await testDbService.healthCheck()).toBe(true)
      
      // CLEANUP
      await testDbService.close()
      const initTestPath = `${TEST_DB_PATH}-init-test`
      if (fs.existsSync(initTestPath)) {
        fs.unlinkSync(initTestPath)
      }
    })

    test('should create database file if it does not exist', async () => {
      // GIVEN: No existing database file
      const newDbPath = path.join(process.cwd(), 'test-new-memo.db')
      if (fs.existsSync(newDbPath)) {
        fs.unlinkSync(newDbPath)
      }
      
      // WHEN: Initialize database service
      const testDbService = new DatabaseService({ databaseUrl: `file:${newDbPath}` })
      await testDbService.initialize()
      
      // THEN: Database file should be created
      expect(fs.existsSync(newDbPath)).toBe(true)
      
      // CLEANUP
      await testDbService.close()
      if (fs.existsSync(newDbPath)) {
        fs.unlinkSync(newDbPath)
      }
    })

    test('should provide accurate health check status', async () => {
      // GIVEN: Initialized database service
      // (using the global dbService)
      
      // WHEN: Health check is performed
      const healthStatus = await dbService.healthCheck()
      
      // THEN: Should return true for healthy connection
      expect(healthStatus).toBe(true)
    })
  })

  describe('Memo CRUD Operations', () => {
    test('should create memo with all required fields', async () => {
      // GIVEN: Valid memo input
      const input: CreateMemoInput = {
        content: "Test memo content",
        x: 100,
        y: 200,
        width: 200,
        height: 150,
        opacity: 0.9,
        priority: 3,
        backgroundColor: "#ffeb3b",
        textColor: "#333333",
        fontSize: 14,
        tags: ["work", "test"]
      }
      
      // WHEN: Create memo
      const memo = await dbService.createMemo(input)
      
      // THEN: Should return memo with generated fields
      expect(memo.id).toBeDefined()
      expect(memo.content).toBe(input.content)
      expect(memo.x).toBe(input.x)
      expect(memo.y).toBe(input.y)
      expect(memo.createdAt).toBeInstanceOf(Date)
      expect(memo.updatedAt).toBeInstanceOf(Date)
      expect(memo.isDeleted).toBe(false)
      expect(memo.tags).toEqual(input.tags)
    })

    test('should create memo with only required fields', async () => {
      // GIVEN: Minimal memo input
      const input: CreateMemoInput = {
        content: "Minimal memo",
        x: 0,
        y: 0
      }
      
      // WHEN: Create memo
      const memo = await dbService.createMemo(input)
      
      // THEN: Should use default values for optional fields
      expect(memo.id).toBeDefined()
      expect(memo.content).toBe("Minimal memo")
      expect(memo.width).toBe(200) // Default width
      expect(memo.height).toBe(150) // Default height
      expect(memo.opacity).toBe(1.0) // Default opacity
      expect(memo.priority).toBe(3) // Default priority
    })

    test('should retrieve memo by ID', async () => {
      // GIVEN: Existing memo in database
      const created = await dbService.createMemo({
        content: "Test memo",
        x: 100,
        y: 200
      })
      
      // WHEN: Get memo by ID
      const retrieved = await dbService.getMemoById(created.id)
      
      // THEN: Should return the same memo
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.content).toBe(created.content)
    })

    test('should return null for non-existent memo ID', async () => {
      // GIVEN: Non-existent memo ID
      const nonExistentId = 'non-existent-id'
      
      // WHEN: Try to get memo by ID
      const memo = await dbService.getMemoById(nonExistentId)
      
      // THEN: Should return null
      expect(memo).toBeNull()
    })

    test('should return empty array when no memos exist', async () => {
      // GIVEN: Empty database
      // (beforeEach clears all data)
      
      // WHEN: Get all memos
      const memos = await dbService.getAllMemos()
      
      // THEN: Should return empty array
      expect(memos).toEqual([])
    })

    test('should return all non-deleted memos ordered by updatedAt desc', async () => {
      // GIVEN: Multiple memos in database
      const memo1 = await dbService.createMemo({ content: "First memo", x: 0, y: 0 })
      await new Promise(resolve => setTimeout(resolve, 10)) // Ensure different timestamps
      const memo2 = await dbService.createMemo({ content: "Second memo", x: 0, y: 0 })
      await new Promise(resolve => setTimeout(resolve, 10))
      const memo3 = await dbService.createMemo({ content: "Third memo", x: 0, y: 0 })
      
      // WHEN: Get all memos
      const memos = await dbService.getAllMemos()
      
      // THEN: Should return all memos in reverse chronological order
      expect(memos).toHaveLength(3)
      expect(memos[0].id).toBe(memo3.id) // Most recent first
      expect(memos[1].id).toBe(memo2.id)
      expect(memos[2].id).toBe(memo1.id)
    })

    test('should update memo with new values', async () => {
      // GIVEN: Existing memo
      const memo = await dbService.createMemo({
        content: "Original content",
        x: 100,
        y: 200,
        priority: 3
      })
      const originalUpdatedAt = memo.updatedAt
      
      await new Promise(resolve => setTimeout(resolve, 10)) // Ensure different timestamp
      
      // WHEN: Update memo
      const updated = await dbService.updateMemo(memo.id, {
        content: "Updated content",
        priority: 5
      })
      
      // THEN: Should return updated memo
      expect(updated.content).toBe("Updated content")
      expect(updated.priority).toBe(5)
      expect(updated.x).toBe(100) // Unchanged field
      expect(updated.y).toBe(200) // Unchanged field
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    test('should soft delete memo', async () => {
      // GIVEN: Existing memo
      const memo = await dbService.createMemo({
        content: "To be deleted",
        x: 100,
        y: 200
      })
      
      // WHEN: Delete memo
      await dbService.deleteMemo(memo.id)
      
      // THEN: Memo should be soft deleted (not returned in regular queries)
      const retrieved = await dbService.getMemoById(memo.id)
      expect(retrieved).toBeNull()
      
      // But should exist in database with isDeleted = true
      const deletedMemo = await dbService.getMemoById(memo.id, { includeDeleted: true })
      expect(deletedMemo).not.toBeNull()
      expect(deletedMemo!.isDeleted).toBe(true)
    })
  })

  describe('Data Validation', () => {
    test('should reject memo creation with missing required fields', async () => {
      // GIVEN: Invalid memo input (missing required fields)
      const invalidInputs = [
        { x: 100, y: 200 }, // Missing content
        { content: "Test" }, // Missing position
        { content: "Test", x: 100 }, // Missing y
        { content: "Test", y: 200 }, // Missing x
      ]
      
      // WHEN & THEN: Each should throw validation error
      for (const input of invalidInputs) {
        await expect(dbService.createMemo(input as any))
          .rejects.toThrow('Validation error')
      }
    })

    test('should reject memo with invalid data types', async () => {
      // GIVEN: Invalid data types
      const invalidInputs = [
        { content: 123, x: 0, y: 0 }, // content should be string
        { content: "Test", x: "100", y: 0 }, // x should be number
        { content: "Test", x: 0, y: "200" }, // y should be number
        { content: "Test", x: 0, y: 0, opacity: "0.5" }, // opacity should be number
      ]
      
      // WHEN & THEN: Each should throw validation error
      for (const input of invalidInputs) {
        await expect(dbService.createMemo(input as any))
          .rejects.toThrow('Invalid data type')
      }
    })

    test('should reject memo with out-of-range values', async () => {
      // GIVEN: Out-of-range values
      const invalidInputs = [
        { content: "Test", x: 0, y: 0, opacity: -0.1 }, // opacity < 0
        { content: "Test", x: 0, y: 0, opacity: 1.1 }, // opacity > 1
        { content: "Test", x: 0, y: 0, priority: 0 }, // priority < 1
        { content: "Test", x: 0, y: 0, priority: 6 }, // priority > 5
        { content: "Test", x: 0, y: 0, fontSize: 7 }, // fontSize < 8
        { content: "Test", x: 0, y: 0, fontSize: 73 }, // fontSize > 72
      ]
      
      // WHEN & THEN: Each should throw validation error
      for (const input of invalidInputs) {
        await expect(dbService.createMemo(input as any))
          .rejects.toThrow('Value out of range')
      }
    })

    test('should reject memo with content exceeding maximum length', async () => {
      // GIVEN: Content exceeding maximum length (10000 characters)
      const longContent = "x".repeat(10001)
      
      // WHEN & THEN: Should throw validation error
      await expect(dbService.createMemo({
        content: longContent,
        x: 0,
        y: 0
      })).rejects.toThrow('Content exceeds maximum length')
    })
  })

  describe('Error Handling', () => {
    test('should throw error when updating non-existent memo', async () => {
      // GIVEN: Non-existent memo ID
      const nonExistentId = 'non-existent-id'
      
      // WHEN & THEN: Update should throw error
      await expect(dbService.updateMemo(nonExistentId, { content: "New content" }))
        .rejects.toThrow('Memo not found')
    })

    test('should throw error when deleting non-existent memo', async () => {
      // GIVEN: Non-existent memo ID
      const nonExistentId = 'non-existent-id'
      
      // WHEN & THEN: Delete should throw error
      await expect(dbService.deleteMemo(nonExistentId))
        .rejects.toThrow('Memo not found')
    })
  })

  describe('Performance', () => {
    test('should complete single memo operations within 100ms', async () => {
      // GIVEN: Test memo data
      const testMemo = {
        content: "Performance test memo",
        x: 100,
        y: 200
      }
      
      // WHEN: Measure create operation time
      const createStart = performance.now()
      const memo = await dbService.createMemo(testMemo)
      const createEnd = performance.now()
      
      // THEN: Should complete within performance requirement
      expect(createEnd - createStart).toBeLessThan(100)
      
      // WHEN: Measure read operation time
      const readStart = performance.now()
      await dbService.getMemoById(memo.id)
      const readEnd = performance.now()
      
      // THEN: Should complete within performance requirement
      expect(readEnd - readStart).toBeLessThan(100)
    })
  })
})

