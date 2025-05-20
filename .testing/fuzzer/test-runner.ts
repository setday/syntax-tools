import * as fs from 'fs';
import * as path from 'path';
import { Cst } from '../cst/cst-parser';
import { generateTestCases } from './fuzz';
import { parseCode } from "../cst/cst-helpers";
import { removeComments, removeSpacesWithUndefined, extractComments } from "./fuzzer-helpers";
import { format } from "../formatter/formatter";

/**
 * Result of processing a test case
 * @typedef {Object} TestResult
 * @property {boolean} success - Whether the test case passed
 * @property {string} [error] - Error message if the test case failed
 * @property {any} [details] - Additional details about the test case processing
 */
export interface TestResult {
  success: boolean;
  error?: string;
  details?: any;
}

/**
 * Configuration for the test runner
 * @typedef {Object} TestConfig
 * @property {number} testCount - Number of test cases to generate
 * @property {string} failedTestsDir - Directory to save failed test cases
 * @property {boolean} saveBadTests - Whether to save failed test cases
 * @property {number} [maxDepth] - Maximum depth for AST generation
 * @property {number} [maxWidth] - Maximum number of children for each node
 * @property {Object} [elementWeight] - Weights for different elements (used at element choosing state)
 * @property {Object} [stopCodes] - Stop codes for specific elements (used at maxDepth)
 * @property {number} [seed] - Random seed for reproducible generation
 */
export interface TestConfig {
  testCount: number;
  failedTestsDir: string;
  saveBadTests: boolean;

  maxDepth?: number;
  maxWidth?: number;
  maxSpaces?: number;
  elementWeight?: { [key: string]: number };
  stopCodes?: { [key: string]: string };
  seed?: number;
}

/**
 * Generate new test cases based on configuration
 */
export function generateTests(config: TestConfig): string[] {
  console.log(`Generating ${config.testCount} test files (max depth: ${config.maxDepth}, ${config.seed !== undefined ? `seed: ${config.seed}` : 'random seed'})...`);
  
  return generateTestCases(config.testCount, {
    maxDepth: config.maxDepth,
    maxWidth: config.maxWidth,
    maxSpaces: config.maxSpaces,
    elementWeight: config.elementWeight,
    stopCodes: config.stopCodes,
    seed: config.seed,
  });
}

/**
 * Load previously failed test cases from disk
 */
export function loadPreviousTestCases(dir: string): string[] {
  const previousTestCases: string[] = [];
  if (!fs.existsSync(dir)) {
    return previousTestCases;
  }

  const previousTestFiles = fs.readdirSync(dir).filter(file => file.endsWith('.tact'));
  for (const file of previousTestFiles) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    previousTestCases.push(content);
  }
  
  return previousTestCases;
}

/**
 * Check if two CSTs have the same comment content
 */
export function checkComments(original: Cst[], formatted: Cst[]): boolean {
  if (original.length === 0 && formatted.length === 0) return true;
  if (original.length === 0 || formatted.length === 0) return false;
  
  const originalJoined = original.map(c => {
    if (c.$ === "node" && c.children && c.children.length > 1 && c.children[1] && c.children[1].$ === "leaf") {
      return c.children[1].text?.trim() || '';
    }
    return '';
  }).join('\n').trim();
  
  const formattedJoined = formatted.map(c => {
    if (c.$ === "node" && c.children && c.children.length > 1 && c.children[1] && c.children[1].$ === "leaf") {
      return c.children[1].text?.trim() || '';
    }
    return '';
  }).join('\n').trim();
  
  return originalJoined === formattedJoined;
}

/**
 * Check if two CSTs are structurally equivalent
 */
export function checkCST(a: Cst, b: Cst): boolean {
  if (a.$ === "leaf" && b.$ === "leaf") {
    return a.text === b.text;
  }
  
  if (a.$ === "node" && b.$ === "node") {
    if (a.type !== b.type || a.group !== b.group || a.field !== b.field) return false;
    if (a.children.length !== b.children.length) return false;
    for (let i = 0; i < a.children.length; i++) {
      if (!checkCST(a.children[i], b.children[i])) return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Process a single test case
 */
export async function processTestCase(testCase: string): Promise<TestResult> {
  try {
    // Parse the test case into CST
    const caseCST = parseCode(testCase);
    
    if (!caseCST) {
      return {
        success: false,
        error: "Failed to parse test case - initial parsing failed",
        details: { stage: "initial-parse" }
      };
    }
    
    const caseWithoutSpaces = removeSpacesWithUndefined(caseCST);

    if (!caseWithoutSpaces) {
      return {
        success: false,
        error: "Failed to parse test case - removing spaces resulted in null CST",
        details: { stage: "remove-spaces" }
      };
    }

    // Format the test case
    const formatted = format(caseCST);
    const formattedCST = parseCode(formatted);
    
    if (!formattedCST) {
      return {
        success: false,
        error: "Failed to parse formatted code",
        details: { stage: "format-parse", formatted }
      };
    }
    
    const formattedWithoutSpaces = removeSpacesWithUndefined(formattedCST);

    if (!formattedWithoutSpaces) {
      return {
        success: false,
        error: "Failed to parse formatted CST after removing spaces",
        details: { stage: "format-remove-spaces" }
      };
    }

    // Check if the CST structure is preserved after formatting
    const originalWithoutComments = removeComments(caseWithoutSpaces);
    const formattedWithoutComments = removeComments(formattedWithoutSpaces);
    
    if (!checkCST(originalWithoutComments, formattedWithoutComments)) {
      return {
        success: false,
        error: "Formatted CST does not match original CST structure",
        details: { 
          stage: "cst-check",
          originalLength: JSON.stringify(originalWithoutComments).length,
          formattedLength: JSON.stringify(formattedWithoutComments).length
        }
      };
    }

    // Check if comments are preserved
    const originalComments = extractComments(caseWithoutSpaces);
    const formattedComments = extractComments(formattedWithoutSpaces);
    
    if (!checkComments(originalComments, formattedComments)) {
      return {
        success: false,
        error: "Comments were not preserved correctly during formatting",
        details: { 
          stage: "comments-check",
          originalComments: originalComments.length,
          formattedComments: formattedComments.length
        }
      };
    }

    return { 
      success: true,
      details: {
        originalLength: testCase.length,
        formattedLength: formatted.length,
        compressionRatio: formatted.length / testCase.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: { stage: "exception", errorType: error instanceof Error ? error.name : typeof error }
    };
  }
}

/**
 * Save test cases that failed formatting
 */
export function saveFailedTest(testCase: string, filename: string, dir: string): void {
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, testCase);
}

/**
 * Generate a report for failed tests
 */
export function generateErrorReport(errors: {file: string, error: string, testCase: string}[], dir: string): string {
  const report = errors.map(e => 
    `${e.file}:\n${e.error}\n\nCode:\n${e.testCase.substring(0, 150)}${e.testCase.length > 150 ? '...' : ''}\n---\n`
  ).join('\n');
  
  const reportPath = path.join(dir, 'error-report.txt');
  fs.writeFileSync(reportPath, report);

  for (const error of errors) {
    const errorFilePath = path.join(dir, error.file);
    fs.writeFileSync(errorFilePath, error.testCase);
  }
  
  return reportPath;
}