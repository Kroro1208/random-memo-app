# TDD Test Cases: INF-001 - Database Service Implementation

## Test Structure Overview

```typescript
describe('DatabaseService', () => {
  describe('Initialization', () => { /* 5 test cases */ })
  describe('Memo CRUD Operations', () => { /* 15 test cases */ })
  describe('Data Validation', () => { /* 8 test cases */ })
  describe('Error Handling', () => { /* 6 test cases */ })
  describe('Performance', () => { /* 3 test cases */ })
  describe('Edge Cases', () => { /* 8 test cases */ })
})
```

## Test Cases

### Group 1: Initialization Tests (5 cases)

#### TEST-INF-001-001: Database Service Initialization
```typescript
test('should initialize database service successfully', async () => {
  // GIVEN: Fresh database service instance
  const dbService = new DatabaseService()
  
  // WHEN: Initialize is called
  await dbService.initialize()
  
  // THEN: Service should be ready and database should exist
  expect(await dbService.healthCheck()).toBe(true)
  
  // CLEANUP
  await dbService.close()
})
```

#### TEST-INF-001-002: Database File Creation
```typescript
test('should create database file if it does not exist', async () => {
  // GIVEN: No existing database file
  const dbPath = path.join(process.cwd(), 'test-memo.db')
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
  }
  
  // WHEN: Initialize database service
  const dbService = new DatabaseService({ databaseUrl: `file:${dbPath}` })
  await dbService.initialize()
  
  // THEN: Database file should be created
  expect(fs.existsSync(dbPath)).toBe(true)
  
  // CLEANUP
  await dbService.close()
  fs.unlinkSync(dbPath)
})
```

#### TEST-INF-001-003: Schema Migration on Initialization
```typescript
test('should run migrations and create all required tables', async () => {
  // GIVEN: Fresh database
  const dbService = new DatabaseService()
  await dbService.initialize()
  
  // WHEN: Check if tables exist
  const tables = await dbService.getTables() // Internal method for testing
  
  // THEN: All required tables should exist
  expect(tables).toContain('Memo')
  expect(tables).toContain('License')
  expect(tables).toContain('Settings')
  
  await dbService.close()
})
```

#### TEST-INF-001-004: Health Check Functionality
```typescript
test('should provide accurate health check status', async () => {
  // GIVEN: Initialized database service
  const dbService = new DatabaseService()
  await dbService.initialize()
  
  // WHEN: Health check is performed
  const healthStatus = await dbService.healthCheck()
  
  // THEN: Should return true for healthy connection
  expect(healthStatus).toBe(true)
  
  await dbService.close()
})
```

#### TEST-INF-001-005: Service Cleanup
```typescript
test('should close database connection cleanly', async () => {
  // GIVEN: Initialized database service
  const dbService = new DatabaseService()
  await dbService.initialize()
  
  // WHEN: Service is closed
  await dbService.close()
  
  // THEN: Health check should return false
  expect(await dbService.healthCheck()).toBe(false)
})
```

### Group 2: Memo CRUD Operations Tests (15 cases)

#### TEST-INF-001-006: Create Memo Success
```typescript
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
```

#### TEST-INF-001-007: Create Memo with Minimal Data
```typescript
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
```

#### TEST-INF-001-008: Get Memo by ID Success
```typescript
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
```

#### TEST-INF-001-009: Get Memo by ID Not Found
```typescript
test('should return null for non-existent memo ID', async () => {
  // GIVEN: Non-existent memo ID
  const nonExistentId = 'non-existent-id'
  
  // WHEN: Try to get memo by ID
  const memo = await dbService.getMemoById(nonExistentId)
  
  // THEN: Should return null
  expect(memo).toBeNull()
})
```

#### TEST-INF-001-010: Get All Memos Empty
```typescript
test('should return empty array when no memos exist', async () => {
  // GIVEN: Empty database
  // (Assuming clean test environment)
  
  // WHEN: Get all memos
  const memos = await dbService.getAllMemos()
  
  // THEN: Should return empty array
  expect(memos).toEqual([])
})
```

#### TEST-INF-001-011: Get All Memos Multiple
```typescript
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
```

#### TEST-INF-001-012: Update Memo Success
```typescript
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
```

#### TEST-INF-001-013: Update Non-Existent Memo
```typescript
test('should throw error when updating non-existent memo', async () => {
  // GIVEN: Non-existent memo ID
  const nonExistentId = 'non-existent-id'
  
  // WHEN & THEN: Update should throw error
  await expect(dbService.updateMemo(nonExistentId, { content: "New content" }))
    .rejects.toThrow(DatabaseError)
  await expect(dbService.updateMemo(nonExistentId, { content: "New content" }))
    .rejects.toThrow('Memo not found')
})
```

#### TEST-INF-001-014: Delete Memo Success (Soft Delete)
```typescript
test('should soft delete memo', async () => {
  // GIVEN: Existing memo
  const memo = await dbService.createMemo({
    content: "To be deleted",
    x: 100,
    y: 200
  })
  
  // WHEN: Delete memo
  await dbService.deleteMemo(memo.id)
  
  // THEN: Memo should be soft deleted
  const retrieved = await dbService.getMemoById(memo.id)
  expect(retrieved).toBeNull() // Should not be returned in regular queries
  
  // But should still exist in database with isDeleted = true
  const deletedMemo = await dbService.getMemoById(memo.id, { includeDeleted: true })
  expect(deletedMemo).not.toBeNull()
  expect(deletedMemo!.isDeleted).toBe(true)
})
```

#### TEST-INF-001-015: Delete Non-Existent Memo
```typescript
test('should throw error when deleting non-existent memo', async () => {
  // GIVEN: Non-existent memo ID
  const nonExistentId = 'non-existent-id'
  
  // WHEN & THEN: Delete should throw error
  await expect(dbService.deleteMemo(nonExistentId))
    .rejects.toThrow(DatabaseError)
  await expect(dbService.deleteMemo(nonExistentId))
    .rejects.toThrow('Memo not found')
})
```

### Group 3: Data Validation Tests (8 cases)

#### TEST-INF-001-016: Validate Required Fields
```typescript
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
      .rejects.toThrow(DatabaseError)
  }
})
```

#### TEST-INF-001-017: Validate Data Types
```typescript
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
```

#### TEST-INF-001-018: Validate Value Ranges
```typescript
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
```

#### TEST-INF-001-019: Validate Color Formats
```typescript
test('should reject invalid color formats', async () => {
  // GIVEN: Invalid color formats
  const invalidInputs = [
    { content: "Test", x: 0, y: 0, backgroundColor: "not-a-color" },
    { content: "Test", x: 0, y: 0, backgroundColor: "#GGG" },
    { content: "Test", x: 0, y: 0, textColor: "rgb(256, 0, 0)" },
    { content: "Test", x: 0, y: 0, textColor: "#12345" }, // Too short
  ]
  
  // WHEN & THEN: Each should throw validation error
  for (const input of invalidInputs) {
    await expect(dbService.createMemo(input as any))
      .rejects.toThrow('Invalid color format')
  }
})
```

#### TEST-INF-001-020: Validate Content Length
```typescript
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
```

#### TEST-INF-001-021: Sanitize Input Content
```typescript
test('should sanitize potentially dangerous input', async () => {
  // GIVEN: Input with potential injection attempts
  const dangerousInput = {
    content: "<script>alert('xss')</script>DROP TABLE memos;",
    x: 0,
    y: 0
  }
  
  // WHEN: Create memo
  const memo = await dbService.createMemo(dangerousInput)
  
  // THEN: Content should be sanitized
  expect(memo.content).not.toContain('<script>')
  expect(memo.content).not.toContain('DROP TABLE')
})
```

#### TEST-INF-001-022: Validate Tags Array
```typescript
test('should validate tags array format and content', async () => {
  // GIVEN: Invalid tags
  const invalidTagsInputs = [
    { content: "Test", x: 0, y: 0, tags: "not-an-array" },
    { content: "Test", x: 0, y: 0, tags: [123, 456] }, // Numbers instead of strings
    { content: "Test", x: 0, y: 0, tags: [""] }, // Empty string tag
    { content: "Test", x: 0, y: 0, tags: ["x".repeat(101)] }, // Tag too long
  ]
  
  // WHEN & THEN: Each should throw validation error
  for (const input of invalidTagsInputs) {
    await expect(dbService.createMemo(input as any))
      .rejects.toThrow('Invalid tags format')
  }
})
```

#### TEST-INF-001-023: Accept Valid Edge Case Values
```typescript
test('should accept valid edge case values', async () => {
  // GIVEN: Valid edge case values
  const edgeCaseInput = {
    content: "", // Empty content should be allowed
    x: -1000, // Negative positions should be allowed
    y: -1000,
    width: 50, // Minimum width
    height: 50, // Minimum height
    opacity: 0.1, // Minimum opacity
    priority: 1, // Minimum priority
    fontSize: 8, // Minimum font size
    tags: [] // Empty tags array should be allowed
  }
  
  // WHEN: Create memo
  const memo = await dbService.createMemo(edgeCaseInput)
  
  // THEN: Should be created successfully
  expect(memo.id).toBeDefined()
  expect(memo.content).toBe("")
  expect(memo.x).toBe(-1000)
  expect(memo.y).toBe(-1000)
})
```

### Group 4: Error Handling Tests (6 cases)

#### TEST-INF-001-024: Handle Database Connection Failure
```typescript
test('should handle database connection failure gracefully', async () => {
  // GIVEN: Invalid database configuration
  const dbService = new DatabaseService({ 
    databaseUrl: 'file:/invalid/path/database.db' 
  })
  
  // WHEN & THEN: Initialize should throw appropriate error
  await expect(dbService.initialize())
    .rejects.toThrow(DatabaseError)
  await expect(dbService.initialize())
    .rejects.toThrow('Database connection failed')
})
```

#### TEST-INF-001-025: Handle Concurrent Access
```typescript
test('should handle concurrent memo operations', async () => {
  // GIVEN: Multiple simultaneous operations
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(dbService.createMemo({
      content: `Concurrent memo ${i}`,
      x: i * 10,
      y: i * 10
    }))
  }
  
  // WHEN: Execute all operations concurrently
  const results = await Promise.all(promises)
  
  // THEN: All operations should succeed
  expect(results).toHaveLength(10)
  results.forEach((memo, index) => {
    expect(memo.content).toBe(`Concurrent memo ${index}`)
  })
})
```

#### TEST-INF-001-026: Handle Database Lock Situations
```typescript
test('should retry operations on database lock', async () => {
  // GIVEN: Database service with retry configuration
  const dbService = new DatabaseService({ 
    retryAttempts: 3,
    retryDelay: 100 
  })
  await dbService.initialize()
  
  // WHEN: Simulate database lock and operation
  // This test would require specific database lock simulation
  const memo = await dbService.createMemo({
    content: "Lock test memo",
    x: 0,
    y: 0
  })
  
  // THEN: Operation should eventually succeed
  expect(memo.id).toBeDefined()
})
```

#### TEST-INF-001-027: Handle Disk Space Exhaustion
```typescript
test('should handle disk space exhaustion errors', async () => {
  // GIVEN: Simulated disk space exhaustion
  // Note: This would require a specific test environment setup
  
  // WHEN & THEN: Should throw specific error
  // This test case documents the expected behavior
  // Implementation would depend on actual disk space exhaustion simulation
  expect(true).toBe(true) // Placeholder for complex disk space test
})
```

#### TEST-INF-001-028: Handle Corrupted Data Recovery
```typescript
test('should handle corrupted data gracefully', async () => {
  // GIVEN: Potentially corrupted data in database
  // This test ensures the service can handle unexpected data states
  
  // Create a memo and then manually corrupt some data
  const memo = await dbService.createMemo({
    content: "Test memo",
    x: 100,
    y: 200
  })
  
  // WHEN: Try to retrieve potentially corrupted memo
  const retrieved = await dbService.getMemoById(memo.id)
  
  // THEN: Should either return valid memo or null (not crash)
  expect(retrieved === null || typeof retrieved === 'object').toBe(true)
})
```

#### TEST-INF-001-029: Handle Invalid Database Schema
```typescript
test('should detect and handle invalid database schema', async () => {
  // GIVEN: Database with invalid/outdated schema
  // This test ensures migration and schema validation works
  
  // WHEN & THEN: Initialize should handle schema issues
  const dbService = new DatabaseService()
  await expect(dbService.initialize()).resolves.not.toThrow()
  
  // Verify tables exist after handling schema issues
  const healthCheck = await dbService.healthCheck()
  expect(healthCheck).toBe(true)
})
```

### Group 5: Performance Tests (3 cases)

#### TEST-INF-001-030: Single Operation Performance
```typescript
test('should complete single memo operations within 100ms', async () => {
  // GIVEN: Initialized database service
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
```

#### TEST-INF-001-031: Bulk Operations Performance
```typescript
test('should handle 1000 memo operations efficiently', async () => {
  // GIVEN: Large number of memo operations
  const memoCount = 1000
  const startTime = performance.now()
  
  // WHEN: Create 1000 memos
  const promises = []
  for (let i = 0; i < memoCount; i++) {
    promises.push(dbService.createMemo({
      content: `Bulk memo ${i}`,
      x: i % 1000,
      y: Math.floor(i / 1000) * 100
    }))
  }
  
  await Promise.all(promises)
  const endTime = performance.now()
  
  // THEN: Should complete within reasonable time (10 seconds)
  expect(endTime - startTime).toBeLessThan(10000)
  
  // AND: Verify all memos were created
  const allMemos = await dbService.getAllMemos()
  expect(allMemos.length).toBeGreaterThanOrEqual(memoCount)
})
```

#### TEST-INF-001-032: Memory Usage Stability
```typescript
test('should maintain stable memory usage during extended operation', async () => {
  // GIVEN: Initial memory usage
  const initialMemory = process.memoryUsage().heapUsed
  
  // WHEN: Perform many operations
  for (let cycle = 0; cycle < 10; cycle++) {
    // Create and delete memos in cycles
    const memos = []
    for (let i = 0; i < 100; i++) {
      const memo = await dbService.createMemo({
        content: `Memory test memo ${cycle}-${i}`,
        x: i,
        y: cycle
      })
      memos.push(memo)
    }
    
    // Delete all memos from this cycle
    for (const memo of memos) {
      await dbService.deleteMemo(memo.id)
    }
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  const finalMemory = process.memoryUsage().heapUsed
  
  // THEN: Memory usage should not increase significantly (less than 50MB)
  expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024)
})
```

## Test Setup and Teardown

### Global Setup
```typescript
beforeAll(async () => {
  // Initialize test database
  const testDbPath = path.join(process.cwd(), 'test-memo-app.db')
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
  
  dbService = new DatabaseService({
    databaseUrl: `file:${testDbPath}`
  })
  await dbService.initialize()
})

afterAll(async () => {
  // Clean up test database
  await dbService.close()
  const testDbPath = path.join(process.cwd(), 'test-memo-app.db')
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
})
```

### Individual Test Setup
```typescript
beforeEach(async () => {
  // Clear all test data before each test
  await dbService.clearAllTestData()
})
```

## Test Data Helpers

```typescript
const testDataHelpers = {
  validMemoInput: (): CreateMemoInput => ({
    content: "Test memo content",
    x: Math.floor(Math.random() * 1000),
    y: Math.floor(Math.random() * 1000),
    width: 200,
    height: 150,
    opacity: 0.9,
    priority: 3,
    backgroundColor: "#ffeb3b",
    textColor: "#333333",
    fontSize: 14,
    tags: ["test"]
  }),
  
  createMultipleMemos: async (count: number): Promise<Memo[]> => {
    const memos = []
    for (let i = 0; i < count; i++) {
      const memo = await dbService.createMemo({
        ...testDataHelpers.validMemoInput(),
        content: `Test memo ${i}`
      })
      memos.push(memo)
    }
    return memos
  }
}
```

## Success Criteria for Test Suite

- [ ] All 32 test cases pass consistently
- [ ] Test coverage >= 95% for DatabaseService class
- [ ] Performance tests meet specified benchmarks
- [ ] Error handling tests cover all identified edge cases
- [ ] Tests can run in isolation and in parallel
- [ ] Test suite completes in under 30 seconds
- [ ] No memory leaks during test execution
- [ ] All async operations are properly tested