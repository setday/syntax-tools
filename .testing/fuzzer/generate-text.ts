import { randomChoice } from "./generator-utils";

// Helper functions to generate random comment text
export function generateRandomCommentText(multiline: boolean): string {
  const commentTypes = [
    "explanation", 
    "todo", 
    "placeholder",
    "fixme",
    "random",
    "true_random"
  ];
  
  const type = randomChoice(commentTypes);
  
  switch (type) {
    case "explanation":
      return randomChoice([
        "Handle the edge case",
        "Process the input data",
        "Calculate the result",
        "Check for errors",
        "Return the value",
        "Update the state",
        "Verify the signature",
        multiline ? "This function performs the following:\n * 1. Validates input\n * 2. Processes data\n * 3. Returns result" : "Validate, process, return"
      ]);
    
    case "todo":
      return randomChoice([
        "TODO: Implement error handling",
        "TODO: Optimize this section",
        "/TODO: Add validation",
        "/TODO: Fix edge cases"
      ]);
      
    case "placeholder":
      return randomChoice([
        "Temporary implementation",
        "Will be replaced",
        "Stub function",
        "Mock data"
      ]);
      
    case "fixme":
      return randomChoice([
        "FIXME: This is not efficient",
        "FIXME: Potential overflow",
        "/FIXME: Missing validation",
        "/FIXME: Handle all cases"
      ]);

    case "random":
      return randomChoice([
        "jhf8erjt=!_+{}",
        "for foreach do",
        "@interface(\"some.api.interface\")",
        "/* This is a comment */"
      ]);

    case "true_random":
      const length = Math.floor(Math.random() * 100) + 1;
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:',.<>?";
      let randomString = "";
      for (let i = 0; i < length; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return randomString;
      
    default:
      return "Comment";
  }
}

export function generateRandomDocComment(): string {
  const docTypes = [
    "function", 
    "param", 
    "return",
    "example",
    "description"
  ];
  
  const type = randomChoice(docTypes);
  
  switch (type) {
    case "function":
      return randomChoice([
        "Calculates the total balance of the contract",
        "Processes the incoming message",
        "Initializes the contract state",
        "Validates the transaction parameters",
        "Transfers tokens to the specified address"
      ]);
    
    case "param":
      return randomChoice([
        "@param amount The amount of tokens to transfer",
        "@param receiver The address that will receive the tokens",
        "@param key The key to look up in the dictionary",
        "@param value The value to store in the contract state"
      ]);
      
    case "return":
      return randomChoice([
        "@returns The calculated hash of the data",
        "@returns Boolean indicating success or failure",
        "@returns The updated balance after the operation",
        "@returns The created message for further processing"
      ]);
      
    case "example":
      return randomChoice([
        "@example\n * ```\n * let result = calculate(10, 20);\n * ```",
        "@example Usage:\n * ```\n * let msg = createMessage(receiver, amount);\n * ```"
      ]);
      
    case "description":
      return randomChoice([
        "This contract implements the Jetton standard",
        "A trait that provides ownership functionality",
        "Stores information about token transfers",
        "Handles message processing logic"
      ]);
      
    default:
      return "Documentation";
  }
}

export function generateName() {
  const nameTypes = [
    "random", 
    "true_random",
  ];
  
  const type = randomChoice(nameTypes);

  switch (type) {
    case "random":
      const prefixes = [
        "My", "Basic", "Test", "Simple", "Advanced", 
        "Token", "NFT", "Jetton", "Contract", "Example",
        "_", "Test_", "Sample_", "Demo_", "Mock_", "klsldf_fjDFLK90",
        "trait", "with", "interface", "contract", "fun",
      ];
      
      const suffixes = [
        "Contract", "Interface", "Trait", 
        "Function", "Message", "State", "kldxjkl875",
        "trait", "with", "interface", "contract", "fun",
      ];
      
      return `${randomChoice(prefixes)}${randomChoice(suffixes)}`;

    case "true_random":
      const length = Math.floor(Math.random() * 20) + 1;
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
      let randomName = "";
      for (let i = 0; i < length; i++) {
        randomName += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (randomName[0].match(/[0-9]/)) {
        randomName = "_" + randomName;
      }
      return randomName;

    default:
      return "DefaultName";
  }
}

export function generateRandomString() {
  const stringTypes = [
    "import",
    "code",
    "funny",
    "alphanumeric",
    "numeric",
    "hexadecimal",
    "binary",
    "custom",
    "true_random",
  ];

  const type = randomChoice(stringTypes);

  switch (type) {
    case "import":
      return randomChoice([
        "./../index.js",
        "@tonlabs/ton",
        "babel/core",
        "ton-core",
      ]);

    case "code":
      return randomChoice([
        "function calculate(a, b) { return a + b; }",
        "let x = 10; let y = 20; let sum = x + y;",
        "const result = myFunction(param1, param2);",
        "if (condition) { doSomething(); } else { doSomethingElse(); }"
      ]);

    case "funny":
      return randomChoice([
        "Why did the programmer quit? Because he didn't get arrays.",
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "Why do Java developers wear glasses? Because they don't see sharp.",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem."
      ]);

    case "alphanumeric":
      return Math.random().toString(36).substring(2, 15);
    
    case "numeric":
      return Math.floor(Math.random() * 1000000).toString();
    
    case "hexadecimal":
      return Math.floor(Math.random() * 16777215).toString(16);
    
    case "binary":
      return Math.floor(Math.random() * 256).toString(2).padStart(8, '0');
    
    case "custom":
      return randomChoice([
        "CustomString1",
        "AnotherCustomString",
        "SampleText123",
        "RandomText!@#",
        "\\r\\a\\n\\d\\o\\m",
        "\\'\\\"\\\\",
        "\\t\\n\\r\\f\\b\\v",
        "\\u{1F600}\\u{1F601}\\u{1F602}",
      ]);

    case "true_random":
      const length = Math.floor(Math.random() * 100) + 1;
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:',.<>?";
      let randomString = "";
      for (let i = 0; i < length; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return randomString;
    
    default:
      return "DefaultString";
  }
}

