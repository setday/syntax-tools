import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path';
import { 
  loadPreviousTestCases, 
  generateTests, 
  processTestCase, 
  saveFailedTest, 
  generateErrorReport,
  TestConfig
} from './fuzzer/test-runner';
import { stopElements } from './fuzzer/stop-elements';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration with defaults
const CONFIG: TestConfig = {
  testCount: 5,
  failedTestsDir: path.join(__dirname, 'failed-tests'),
  saveBadTests: false,

  maxDepth: 20,
  maxSpaces: 0,

  stopCodes: stopElements,
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i].toLowerCase();
    
    if (arg === '--count' || arg === '-c') {
      CONFIG.testCount = parseInt(args[++i], 10);
    } else if (arg === '--save-bad' || arg === '-s') {
      CONFIG.saveBadTests = true;
    } else if (arg === '--dir' || arg === '-d') {
      CONFIG.failedTestsDir = path.resolve(args[++i]);
    } else if (arg === '--max-depth' || arg === '-m') {
      CONFIG.maxDepth = parseInt(args[++i], 10);
    } else if (arg === '--seed') {
      CONFIG.seed = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }
}

function printHelp() {
  console.log(`
Tact Fuzzer - Generate and test random Tact code snippets

Options:
  --count, -c       Number of test cases to generate (default: ${CONFIG.testCount})
  --save-bad, -s    Save failing test cases to disk (default: ${CONFIG.saveBadTests})
  --dir, -d         Directory to save failed tests (default: ${CONFIG.failedTestsDir})
  --max-depth, -m   Maximum depth for AST generation (default: ${CONFIG.maxDepth})
  --seed            Random seed for reproducible generation
  --help, -h        Show this help message
  `);
}

/**
 * Run fuzzer and tests
 */
async function runTests() {
  parseArgs();

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.failedTestsDir)) {
    fs.mkdirSync(CONFIG.failedTestsDir, { recursive: true });
  }

  // Load previous failed tests
  const previousTestCases = loadPreviousTestCases(CONFIG.failedTestsDir);
  console.log(`Loaded ${previousTestCases.length} previously failed test cases.`);

  // Generate new test cases
  const generatedTestCases = generateTests(CONFIG);

  // Combine test cases
  const testCases = [...previousTestCases, ...generatedTestCases];
  
  let passed = 0;
  let failed = 0;
  let errors: {file: string, error: string, testCase: string}[] = [];
    
  // Process each test case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = await processTestCase(testCase);
    
    if (result.success) {
      passed++;
      console.log(`✅ [${i + 1}/${testCases.length}] Test case passed (${testCase.length} -> ${Math.floor(testCase.length * result.details.compressionRatio)} bytes)`);
    } else {
      const filename = `test-${failed.toString().padStart(3, '0')}.tact`;

      // Save failing test cases if enabled
      if (CONFIG.saveBadTests) {
        saveFailedTest(testCase, filename, CONFIG.failedTestsDir);
        console.log(`   Test case saved to ${path.join(CONFIG.failedTestsDir, filename)}`);
      }

      console.error(`❌ [${i + 1}/${testCases.length}] Test failed: ${result.error}`);

      errors.push({
        file: filename, 
        error: result.error || 'Unknown error', 
        testCase
      });
      failed++;
    }
  }
  
  // Print summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${passed} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / testCases.length) * 100).toFixed(1)}%)`);
  
  // Generate error report
  if (failed > 0) {
    const reportPath = generateErrorReport(errors, CONFIG.failedTestsDir);
    console.log(`\nError details written to ${reportPath}`);
  }
  
  return { passed, failed };
}

// Run tests if executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
