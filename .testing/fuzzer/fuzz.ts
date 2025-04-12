import * as fs from "fs"
import * as path from "path"
import { Module, Context, Builder } from "./generator"

// Fuzzy generator class
class TactFuzzer {
  private maxDepth: number = 15
  private maxWidth: number = 5
  private rng: () => number

  constructor(options: { maxDepth?: number, seed?: number } = {}) {
    this.maxDepth = options.maxDepth || 5
    
    // Initialize RNG with seed if provided
    const seed = options.seed || Math.floor(Math.random() * 1000000)
    this.rng = this.createRng(seed)
  }
  
  // Simple seeded random number generator
  private createRng(seed: number) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }
  
  // Pick random item from array
  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rng() * arr.length)]
  }
  
  // Generate a program starting from the main rule (usually 'Program')
  generate(): string {
    const context: Context = { maxWidth: this.maxWidth, maxDepth: this.maxDepth, depth: 0 }
    let builder: Builder = []
    Module(context, builder)
    return builder.join('')
  }
  
  // Generate multiple programs
  generateMultiple(count: number): string[] {
    return Array(count).fill(0).map(() => this.generate())
  }
}

// Main function to generate test cases
export function generateTestCases(count: number = 10, options: any = {}) {
  const fuzzer = new TactFuzzer(options)
  return fuzzer.generateMultiple(count)
}

// Write test cases to files
export function writeTestCases(count: number = 10, outputDir: string = "fuzzy-tests", options: any = {}) {
  const testCases = generateTestCases(count, options)
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Write each test case to a file
  testCases.forEach((code, index) => {
    const filename = path.join(outputDir, `test-${index.toString().padStart(3, '0')}.tact`)
    fs.writeFileSync(filename, code)
  })
  
  console.log(`Generated ${count} test cases in ${outputDir}`)
  return testCases
}

// If run directly, generate some test cases
if (true) {
  writeTestCases(5)
}
