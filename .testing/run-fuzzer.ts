import * as fs from 'fs'
import * as path from 'path'
import { generateTestCases } from './fuzzer/fuzz'
import { parseCode } from "./cst/cst-helpers"
import { removeComments, removeSpacesWithUndefined, extractComments } from "./fuzzer/fuzzer-helpers"
import { format } from "./formatter/formatter";
import { fileURLToPath } from 'url'
import { dirname } from 'path';
import { Cst } from './cst/cst-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_COUNT = 0;
const FAILED_TESTS_DIR = path.join(__dirname, 'failed-tests');
const SAVE_BAD_TESTS = false;


function checkComments(original: Cst[], formatted: Cst[]): boolean {
  const originalJoined = original.map(c => c.children[1].text.trim()).join('\n').trim();
  const formattedJoined = formatted.map(c => c.children[1].text.trim()).join('\n').trim();
  return originalJoined === formattedJoined;
}

function checkCST(a: Cst, b: Cst): boolean {
  if (a.$ === "leaf") return b.$ === "leaf" && a.text === b.text;
  if (a.$ === "node") {
    if (b.$ !== "node" || a.type !== b.type || a.group !== b.group || a.field !== b.field) return false;
    if (a.children.length !== b.children.length) return false;
    for (let i = 0; i < a.children.length; i++) {
      a.children
      if (!checkCST(a.children[i], b.children[i])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Run fuzzer and tests
 */
async function runTests() {
  if (!fs.existsSync(FAILED_TESTS_DIR)) {
      fs.mkdirSync(FAILED_TESTS_DIR, { recursive: true });
  }

  let previousTestCases: string[] = [];
  let loadedCount = 0;
  const previousTestFiles = fs.readdirSync(FAILED_TESTS_DIR).filter(file => file.endsWith('.tact'));
  for (const file of previousTestFiles) {
      const filePath = path.join(FAILED_TESTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      previousTestCases.push(content);
      loadedCount++;
  }

  console.log(`Generating ${TEST_COUNT} test files...`);
  const generatedTestCases = generateTestCases(TEST_COUNT);

  let testCases = [...previousTestCases, ...generatedTestCases];
  
  let passed = 0;
  let failed = 0;
  let errors: {file: string, error: string}[] = [];
    
  for (const testCase of testCases) {
    try {
      // const normalizedCase = normalizeIndentation(testCase).trim();
      const caseCST = parseCode(testCase);
      const caseWithoutSpaces = removeSpacesWithUndefined(caseCST);

      // Redundant check for !caseCST
      if (!caseCST || !caseWithoutSpaces) {
        throw new Error("Failed to parse test case.\n!!!WARNING!!! The problem may be in the generator, not in the formatter.");
      }

      const formatted = format(caseCST)
      const formattedCST = parseCode(formatted);

      const formatedWithoutSpaces = removeSpacesWithUndefined(formattedCST);

      if (!formatedWithoutSpaces) {
        throw new Error("Failed to parse formatted CST");
      }

      if (!checkCST(removeComments(caseWithoutSpaces), removeComments(formatedWithoutSpaces))) {
        throw new Error("Formatted CST does not match original CST");
      }

      if (!checkComments(extractComments(caseWithoutSpaces), extractComments(formatedWithoutSpaces))) {
        throw new Error("Comments mismatch");
      }

      passed++;
      console.log(`✅ Test case passed: ${testCase}`);
    } catch (error) {
      const filename = `test-${(failed + loadedCount).toString().padStart(3, '0')}.tact`;
      const filepath = path.join(FAILED_TESTS_DIR, filename);

      if (SAVE_BAD_TESTS) {
        fs.writeFileSync(filepath, testCase);
      }

      console.error(`❌ Error processing test case: ${error}`);
      console.log(`Saved failed test case to ${filepath}`);

      errors.push({file: filename, error: error.message});
      failed++;
    }
  }
  
  console.log('\n--- Test Summary ---');
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    const report = errors.map(e => `${e.file}:\n${e.error}\n---\n`).join('\n');
    fs.writeFileSync(path.join(FAILED_TESTS_DIR, 'error-report.txt'), report);
    console.log(`\nError details written to ${path.join(FAILED_TESTS_DIR, 'error-report.txt')}`);
  }
  
  return { passed, failed };
}

if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(console.error);
}
