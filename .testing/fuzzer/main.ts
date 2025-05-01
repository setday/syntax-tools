import * as $ from "@tonstudio/parser-runtime"
import * as g from "./generator-generator"
import * as G from "../../packages/pgen/grammar"
import {desugar} from "../../packages/pgen/cst/transform"
import { generate } from "@babel/generator"
import {inspect} from "util"
import * as fs from "fs"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const log = (obj: unknown) => console.log(inspect(obj, {colors: true, depth: Infinity}))

const ast = $.parse({
    grammar: G.Grammar,
    space: G.space,
    text: fs.readFileSync("../grammar.gg", "utf8"),
})
if (ast.$ === "error") {
    console.error(ast.error)
    process.exit(1)
}

const transformed = desugar(ast.value)

const parserAst = g.generate(transformed)

const PARSER_HEADER = `
import { randomBool, randomInt, randomChoice, randomChar, allChars } from "./generator-utils";
import { generateRandomCommentText, generateRandomDocComment, generateRandomString, generateName } from "./generate-text";

export const createContext = (s: string, space: Rule) => ({
    s,
    p: 0,
    l: s.length,
    space,
});

export type Context = {
    maxWidth: number,
    maxDepth: number,
    depth: number,
}

export type Builder = string[]

export type Rule = (ctx: Context, b: Builder, field?: string) => void

export const appendString = (ctx: Context, b: Builder, str: string) => {
    b.push(str);
}

export const appendClass = (ctx: Context, b: Builder, neg: boolean, chars: string[]) => {
    if (neg) {
        const allCharsArray = allChars.split("");
        chars = allCharsArray.filter(c => !chars.includes(c));
    }
    appendString(ctx, b, randomChoice(chars));
}

export const appendAny = (ctx: Context, b: Builder) => {
    appendString(ctx, b, randomChar(undefined));
}

export const singleLineComment = (ctx: Context, b: Builder) => {
    b.push("//");
    b.push(generateRandomCommentText(false));
    b.push("\\n");
}

export const multiLineComment = (ctx: Context, b: Builder) => {
    b.push("/*");
    b.push(generateRandomCommentText(true));
    b.push("*/");
}

export const StringLiteral = (ctx: Context, b: Builder, str: string) => {
    b.push("\\"");
    b.push(generateRandomString());
    b.push("\\"");
}

export const Id = (ctx: Context, b: Builder, str: string) => {
    b.push(generateName());
}

`

const parserGenerated = generate(parserAst, {minified: false}).code
const parserResult = PARSER_HEADER + parserGenerated

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
fs.writeFileSync(__dirname + "/generator.ts", parserResult)
