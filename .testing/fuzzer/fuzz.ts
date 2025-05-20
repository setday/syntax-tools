import * as fs from "fs"
import * as path from "path"
import { Module, Context, Builder } from "./generator"
import { randomInt } from "./generator-utils"

/**
 * Configuration options for the fuzzer
 */
export interface FuzzerOptions {
  maxDepth?: number;
  maxWidth?: number;
  maxSpaces?: number;
  elementWeight?: { [key: string]: number };
  stopCodes?: { [key: string]: string };
  seed?: number;
}

/**
 * Fuzzer generator class for Tact language
 */
class TactFuzzer {
  private maxDepth: number;
  private maxWidth: number;
  private maxSpaces: number;
  private elementWeight: { [key: string]: number };
  private stopCodes: { [key: string]: string };
  private rng: () => number;
  private seed: number;

  constructor(options: FuzzerOptions = {}) {
    this.maxDepth = options.maxDepth === undefined ? 15 : options.maxDepth;
    this.maxWidth = options.maxWidth === undefined ? 5 : options.maxWidth;
    this.maxSpaces = options.maxSpaces === undefined ? 2 : options.maxSpaces;
    this.elementWeight = options.elementWeight || {};
    this.stopCodes = options.stopCodes || {};
    
    // Initialize RNG with seed if provided
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    console.log(`Using seed: ${this.seed}`);
    this.rng = this.createRng(this.seed);
  }
  
  /**
   * Creates a simple seeded random number generator
   * @param seed Initial seed value
   */
  private createRng(seed: number) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * Checks if a character is a valid name part (alphanumeric or underscore)
   * @param c Character to check
   */
  private isNamePart(c: string | undefined): boolean {
    if (!c) return false;
    return /^[a-zA-Z0-9_]$/.test(c);
  }
  
  /**
   * Generates a program starting from the main rule
   */
  generate(): string {
    const context: Context = { 
      maxWidth: this.maxWidth, 
      maxDepth: this.maxDepth, 
      elementWeight: this.elementWeight,
      stopCodes: this.stopCodes,
      depth: 0 
    };

    let builder: Builder = [];
    Module(context, builder);
    builder = builder.filter((s) => s.length > 0);
    
    // Add spaces between identifiers to prevent collisions
    for (let i = 1; i < builder.length; i++) {
      const isSpaceNeeded = this.isNamePart(builder[i][0]) &&
                            this.isNamePart(builder[i - 1].at(-1));
      let extraSpacesCount = randomInt(0, this.maxSpaces);
      
      if (extraSpacesCount == 0 && isSpaceNeeded) {
        extraSpacesCount = 1;
      }

      builder[i - 1] += " ".repeat(extraSpacesCount);
    }
    
    return builder.join('');
  }
  
  /**
   * Generates multiple programs
   * @param count Number of programs to generate
   */
  generateMultiple(count: number): string[] {
    return Array(count).fill(0).map(() => this.generate());
  }
  
  /**
   * Returns the current seed value
   */
  getSeed(): number {
    return this.seed;
  }
}

/**
 * Main function to generate test cases
 * @param count Number of test cases to generate
 * @param options Fuzzer configuration options
 */
export function generateTestCases(count: number = 10, options: FuzzerOptions = {}): string[] {
  const fuzzer = new TactFuzzer(options);
  return fuzzer.generateMultiple(count);
}

/**
 * Writes generated test cases to files
 * @param count Number of test cases to generate
 * @param outputDir Directory to write test cases to
 * @param options Fuzzer configuration options
 */
export function writeTestCases(count: number = 10, outputDir: string = "fuzzy-tests", options: FuzzerOptions = {}): string[] {
  const testCases = generateTestCases(count, options);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write each test case to a file
  testCases.forEach((code, index) => {
    const filename = path.join(outputDir, `test-${index.toString().padStart(3, '0')}.tact`);
    fs.writeFileSync(filename, code);
  });
  
  console.log(`Generated ${count} test cases in ${outputDir}`);
  return testCases;
}

// If run directly, generate some test cases
// if (import.meta.url === new URL(import.meta.url).href) {
//   writeTestCases(5);
// }
