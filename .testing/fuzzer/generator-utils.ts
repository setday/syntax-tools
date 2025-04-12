/**
 * Utility functions for random generation
 */

/**
 * Returns a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random Hexadecimal string of specified length
 */
export function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result;
}

/**
 * Returns a random boolean with specified likelihood of being true
 */
export function randomBool(trueLikelihood: number = 0.5): boolean {
  return Math.random() < trueLikelihood;
}

/**
 * Picks a random item from an array
 */
export function randomChoice<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

/**
 * Picks multiple random items from an array
 */
export function randomChoices<T>(items: T[], count: number): T[] {
  const result: T[] = [];
  const available = [...items];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = randomInt(0, available.length - 1);
    result.push(available[index]);
    available.splice(index, 1);
  }
  
  return result;
}

export const allChars = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~";

/**
 * Returns a random character from a given string
 */
export function randomChar(chars: string | undefined): string {
  if (!chars) {
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_!@#$%^&*()_+[]{}|;:',.<>? /`~";
  }
  return chars[randomInt(0, chars.length - 1)]; 
}

/**
 * Generates a random identifier name
 */
export function randomIdentifier(options: {
  prefix?: string,
  minLength?: number,
  maxLength?: number,
  lowerCase?: boolean
} = {}): string {
  const { 
    prefix = "",
    minLength = 3,
    maxLength = 10,
    lowerCase = true
  } = options;
  
  const length = randomInt(minLength, maxLength);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const firstChars = lowerCase ? chars : chars + chars.toUpperCase();
  const allChars = firstChars + "0123456789_";
  
  let result = prefix;
  if (result.length === 0) {
    result += firstChars[randomInt(0, firstChars.length - 1)];
  }
  
  for (let i = result.length; i < length; i++) {
    result += allChars[randomInt(0, allChars.length - 1)];
  }
  
  return result;
}

/**
 * Random boolean that's more likely to return false as depth increases
 */
export function depthAwareRandomBool(depth: number, base: number = 0.7): boolean {
  const probability = base * Math.pow(0.7, depth);
  return randomBool(probability);
}

/**
 * Common prefixes for different types of identifiers
 */
export const commonPrefixes = {
  variables: ["i", "j", "k", "n", "x", "y", "z", "val", "var", "tmp", "result", "data"],
  parameters: ["param", "arg", "input", "value", "data", "ctx", "self"],
  functions: ["get", "set", "calc", "compute", "build", "create", "check", "validate", "process"],
  contracts: ["My", "Basic", "Test", "Simple", "Advanced", "Token", "NFT", "Jetton"],
  structs: ["Data", "Info", "Config", "State", "Params", "Result", "Request", "Response"]
};
