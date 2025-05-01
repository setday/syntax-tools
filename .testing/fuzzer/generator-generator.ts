import * as t from '@babel/types';
import * as g from '../../packages/pgen/cst/transform';

export const generate = (node: g.Grammar): t.File => {
    return t.file(t.program(
        node.rules.map((it) => generateRule(it))
    ))
}

export const generateRule = (node: g.Rule): t.ExportNamedDeclaration | t.EmptyStatement => {
    const name = t.identifier(node.name);

    // This would be generated separately from the grammar (so we can inser corner cases in them)
    const specials = ["multiLineComment", "singleLineComment", "StringLiteral", "Id"];
    if (specials.includes(node.name)) {
        return t.emptyStatement()
    }

    if (node.formals.length > 0) {
        name.typeAnnotation = t.tsTypeAnnotation(t.tsFunctionType(
            undefined,
            node.formals.map(it => {
                const ident = t.identifier(it);
                ident.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Rule")))
                return ident
            }),
            t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Rule")))
        ))
    } else {
        name.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Rule")))
    }

    const arrowFunction = t.arrowFunctionExpression(
        [
            t.identifier("ctx"),
            t.identifier("b"),
            t.identifier("field"),
        ],
        t.blockStatement(generateExpr(node.body, node.isPrivate ? "" : node.name, undefined))
    );

    // export const commaList: (T: Rule) => Rule = (T: Rule) => {
    //     return (ctx, b) => { ... }
    // }
    if (node.formals.length > 0) {
        return t.exportNamedDeclaration(t.variableDeclaration(
            'const',
            [
                t.variableDeclarator(
                    name,
                    t.arrowFunctionExpression(
                        node.formals.map(it => t.identifier(it)),
                        t.blockStatement(
                            [
                                t.returnStatement(
                                    arrowFunction
                                )
                            ]
                        )
                    ),
                )
            ]
        ))
    }

    return t.exportNamedDeclaration(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(
                name,
                arrowFunction,
            )
        ]
    ))
}

export const generateExpr = (node: g.Expr, ruleName: string, fieldName: undefined | string): t.Statement[] => {
    switch (node.$) {
        case 'Seq':
            return generateSeq(node)
        case 'Alt':
            return generateAlt(node)
        case 'Star':
            return generateStar(node)
        case 'Plus':
            return generatePlus(node)
        case 'Terminal':
            return generateSeq(g.Seq([g.SeqClause(node, undefined)]))
        case 'Class':
            return generateClass(node)
        case 'Stringify':
            return generateStringify(node)
        case 'Lex':
            return generateLex(node, ruleName)
        case 'Optional':
            return generateOptional(node, ruleName)
        case "Any":
            return generateAny()
        case "Call":
            return generateCall(node, ruleName, fieldName)
        case "LookNeg":
            return generateLookNeg(node)
        case "LookPos":
            return generateLookPos(node)
        // TODO
        // - check escapes
        // - positions
        // - fix nesting
        // - rules
        //   - char class
        //      - others
    }
}

// const b: Builder = []
const createEmptyBuilder = (builderName: string) => {
    const ident = t.identifier(builderName)
    ident.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Builder")))
    return t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(
                ident,
                t.arrayExpression([])
            )
        ]
    );
};

// b.push(...b2)
const storeNodeFromBuilder = (name: string) => t.expressionStatement(
    t.callExpression(
        t.memberExpression(
            t.identifier("b"),
            t.identifier("push")
        ), [
            t.spreadElement(t.identifier(name)),
        ]
    )
        
);

// b.push(expr)
const storeLeaf = (expr: t.Expression) => t.expressionStatement(
    t.callExpression(
        t.memberExpression(
            t.identifier("b"),
            t.identifier("push")
        ), [
            expr,
        ])
);

// if (b2.length > 0) {
//    b.push(...b2)
// }
const storeNodeIfNotEmpty = () => t.ifStatement(
    t.binaryExpression(
        '>',
        t.memberExpression(t.identifier("b2"), t.identifier("length")),
        t.numericLiteral(0)
    ),
    t.blockStatement([
        storeNodeFromBuilder("b2")
    ]),
);

// const A = (ctx: Context, b: Builder): void => {
//     pass
// }
export const generateLookPos = (lookNeg: g.LookPos): t.Statement[] => {
    return []
}

// !!! IGNORE (we don't generate negation) !!!
// A = !B
// const A = (ctx: Context, b: Builder): void => {
//     pass
// }
export const generateLookNeg = (lookNeg: g.LookNeg): t.Statement[] => {
    return []
}

export const compileCall = (call: g.Call): t.Expression => {
    if (call.params.length > 0) {
        // commaList(Foo)(args)
        const params = call.params.map(param => {
            if (param.$ === "Call") {
                return compileCall(param)
            }
            if (param.$ === "Terminal") {
                // (ctx, b) => appendToken(ctx, b, <param>)
                return t.arrowFunctionExpression(
                    [
                        t.identifier("ctx"),
                        t.identifier("b"),
                    ],
                    compileTerminal(param, t.identifier("b"))
                )
            }
            if (param.$ === "Class") {
                // (ctx, b) => appendClass(ctx, b, <param>)
                return t.arrowFunctionExpression(
                    [
                        t.identifier("ctx"),
                        t.identifier("b"),
                    ],
                    compileClass(param, t.identifier("b"))
                )
            }
            if (param.$ === "Any") {
                return t.arrowFunctionExpression(
                    [
                        t.identifier("ctx"),
                        t.identifier("b"),
                    ],
                    compileAny(t.identifier("b"))
                )
            }
            throw new Error(`Unsupported param ${param.$}`)
        })

        return emitCall(call.name, params)
    }

    return t.identifier(call.name)
}

export const generateSpaces = (): t.Statement => {
    return t.blockStatement([])
    const rand_spaces = t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("spaces_count"), t.callExpression(
                t.identifier("randomInt"),
                [
                    t.numericLiteral(0),
                    t.numericLiteral(2),
                ]
            )),
            t.variableDeclarator(t.identifier("spaces"), t.callExpression(
                t.identifier("\" \".repeat"),
                [
                    t.identifier("spaces_count"),
                ]
            ))
        ]
    );
    const returns = t.expressionStatement(
        t.callExpression(
        t.memberExpression(
            t.identifier("b2"),
            t.identifier("push")
        ), [
            t.identifier("spaces"),
        ]
    ));

    return t.blockStatement([
        rand_spaces,
        returns,
    ])
}

// export const FunctionDefinition: Rule = (ctx, b, field) => {
//     if (ctx.depth > ctx.maxDepth) {
//         return
//     }
//
//     ctx.depth++
//
//     const b2: Builder = [];
//     
//     statements(ctx, b2);
//     if (b2.length > 0) {
//         b.push(b2);
//     }
//
//     ctx.depth--
// };
export const generateCall = (call: g.Call, ruleName: string, fieldName: undefined | string): t.Statement[] => {
    const stmts: t.Statement[] = []

    // if (ctx.depth > ctx.maxDepth) {
    //     return
    // }
    stmts.push(t.ifStatement(
        t.binaryExpression(
            '>',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            t.memberExpression(t.identifier("ctx"), t.identifier("maxDepth"))
        ),
        t.blockStatement([
            t.returnStatement()
        ])
    ))

    // ctx.depth++
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '++',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    if (ruleName.length > 0 && (isLowerCase(ruleName[0]) || ruleName[0] === "$")) {
        const stmts: t.Statement[] = []

        const expr = compileCall(call)

        // return B(ctx, b)
        stmts.push(t.returnStatement(
            t.callExpression(
                expr,
                [
                    t.identifier("ctx"),
                    t.identifier("b"),
                    t.identifier("field"),
                ]
            )
        ))

        return stmts
    }

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))

    const expr = compileCall(call)

    const callExpr = t.callExpression(
        expr,
        [
            t.identifier("ctx"),
            t.identifier("b2"),
            ...(fieldName ? [t.stringLiteral(fieldName)] : []),
        ]
    )

    stmts.push(t.expressionStatement(
        callExpr
    ))

    stmts.push(t.ifStatement(
        t.binaryExpression(
            '>',
            t.memberExpression(t.identifier("b2"), t.identifier("length")),
            t.numericLiteral(0)
        ),
        t.blockStatement([
            t.expressionStatement(t.callExpression(
                t.memberExpression(
                    t.identifier("b"),
                    t.identifier("push")
                ), [
                    t.spreadElement(t.identifier("b2")),
                ])
            )
        ]),
    ))

    // ctx.depth--
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '--',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    return stmts
}

// const A = (ctx: Context, b: Builder): void => {
//     const shouldSkip = randomBool()
// 
//     if (shouldSkip) {
//         return
//     }
//
//     const c = randomChar()
//     b.push(c)
// }
export const generateAny = (): t.Statement[] => {
    const stmts: t.Statement[] = []

    // const shouldSkip = randomBool()
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("shouldSkip"), t.callExpression(
                t.identifier("randomBool"),
                []
            ))
        ]
    ))

    // if (shouldSkip) {
    //     return
    // }
    stmts.push(t.ifStatement(
        t.identifier("shouldSkip"),
        t.blockStatement([
            t.returnStatement()
        ])
    ))

    // const c = randomChar()
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("c"), t.callExpression(
                t.identifier("randomChar"),
                [
                    t.identifier("undefined")
                ]
            ))
        ]
    ))

    // b.push(c)
    stmts.push(storeLeaf(t.identifier("c")))
    return stmts
}

// A = B?
//
// const A = (ctx: Context, b: Builder, rule: Rule): boolean => {
//     const b2: Builder = []
//     const shouldUseB = randomBool()
//
//     if (shouldUseB) {
//         B(ctx, b2)
//     }
//
//     if (b2.length > 0) {
//         b.push(CstNode(b2))
//     }
// }
export const generateOptional = (node: g.Optional, ruleName: string): t.Statement[] => {
    const stmts: t.Statement[] = []

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))
    
    // const shouldUseB = randomBool()
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("shouldUseB"), t.callExpression(
                t.identifier("randomBool"),
                []
            ))
        ]
    ))

    // if (shouldUseB) {
    //     B(ctx, b2)
    // }
    stmts.push(t.ifStatement(
        t.identifier("shouldUseB"),
        t.blockStatement([
            t.expressionStatement(generateClause(node.expr, undefined, t.identifier("b2")))
        ])
    ))

    // if (b2.length > 0) {
    //    b.push(b2)
    // }
    stmts.push(storeNodeIfNotEmpty())

    return stmts
}

// !!! IGNORE (we don't care about the names) !!!
// A = #B
// const A = (ctx: Context, b: Builder, rule: Rule): boolean => {
//     B(ctx, b)
// }
export const generateLex = (node: g.Lex, ruleName: string): t.Statement[] => {
    const stmts: t.Statement[] = []

    // B(ctx, b)
    const clause = generateClause(node.expr, undefined, t.identifier("b"))
    stmts.push(t.expressionStatement(clause))

    return stmts
}

// !!! IGNORE (no need to save the name) !!!
// A = $B
// const A = (ctx, b) => {
//     B(ctx, b)
// }
export const generateStringify = (node: g.Stringify): t.Statement[] => {
    const stmts: t.Statement[] = []

    // B(ctx, b)
    const clause = generateClause(node.expr, undefined, t.identifier("b"))
    stmts.push(t.expressionStatement(clause))

    return stmts
}

// A = B*
// A = (B A) | ""
// const A = (ctx, b) => {
//     const b2: Builder = []
//     const maxWidth = ctx.maxWidth
//     const count = randomInt(0, maxWidth);
//     for (let i = 0; i < count; i++) {
//         B(ctx, b2);
//     }
//     if (b2.length > 0) {
//         b.push(b2)
//     }
// }
export const generateStar = (node: g.Star): t.Statement[] => {
    const stmts: t.Statement[] = []

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))

    // const maxWidth = ctx.maxWidth
    // const count = randomInt(0, maxWidth);
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("maxWidth"), t.memberExpression(t.identifier("ctx"), t.identifier("maxWidth"))),
            t.variableDeclarator(t.identifier("count"), t.callExpression(
                t.identifier("randomInt"),
                [
                    t.numericLiteral(0),
                    t.identifier("maxWidth"),
                ]
            ))
        ]
    ))

    // for (let i = 0; i < count; i++) {
    //     B(ctx, b2);
    // }
    const clause = generateClause(node.expr, undefined, t.identifier("b2"))
    stmts.push(t.forStatement(
        t.variableDeclaration(
            'let',
            [
                t.variableDeclarator(t.identifier("i"), t.numericLiteral(0))
            ]
        ),
        t.binaryExpression(
            '<',
            t.identifier("i"),
            t.identifier("count")
        ),
        t.updateExpression(
            '++',
            t.identifier("i"),
            false
        ),
        t.blockStatement([
            t.expressionStatement(clause)
        ])
    ))

    // if (b2.length > 0) {
    //    b.push(CstNode(b2))
    // }
    stmts.push(storeNodeIfNotEmpty())

    // return true
    stmts.push(t.returnStatement(t.identifier("true")))
    return stmts
}

// A = B+
// const A = (ctx, b) => {
//     const b2: Builder = []
//     const maxWidth = ctx.maxWidth 
//     const count = randomInt(0, maxWidth - 1);
//     B(ctx, b2);
//     for (let i = 0; i < count; i++) {
//         B(ctx, b2);
//     }
//     if (b2.length > 0) {
//         b.push(CstNode(b2))
//     }
// }
export const generatePlus = (node: g.Plus): t.Statement[] => {
    const stmts: t.Statement[] = []

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))

    // const maxWidth = ctx.maxWidth
    // const count = randomInt(0, maxWidth);
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("maxWidth"), t.memberExpression(t.identifier("ctx"), t.identifier("maxWidth"))),
            t.variableDeclarator(t.identifier("count"), t.callExpression(
                t.identifier("randomInt"),
                [
                    t.numericLiteral(0),
                    t.binaryExpression(
                        '-',
                        t.identifier("maxWidth"),
                        t.numericLiteral(1)
                    ),
                ]
            ))
        ]
    ))

    // B(ctx, b2);
    const clause = generateClause(node.expr, undefined, t.identifier("b2"))
    stmts.push(t.expressionStatement(
        clause
    ))

    // for (let i = 0; i < count; i++) {
    //     B(ctx, b2);
    // }
    stmts.push(t.forStatement(
        t.variableDeclaration(
            'let',
            [
                t.variableDeclarator(t.identifier("i"), t.numericLiteral(0))
            ]
        ),
        t.binaryExpression(
            '<',
            t.identifier("i"),
            t.identifier("count")
        ),
        t.updateExpression(
            '++',
            t.identifier("i"),
            false
        ),
        t.blockStatement([
            t.expressionStatement(clause)
        ])
    ))

    // if (b2.length > 0) {
    //    b.push(CstNode(b2))
    // }
    stmts.push(storeNodeIfNotEmpty())

    return stmts
}

const compileClass = (node: g.Class, builderName: t.Expression, ctxName?: t.Expression) => {
    const expr = node.seqs.reduce((prev: t.Expression[], seq): t.Expression[] => {
        let thisExpr: t.Expression[] = []

        switch (seq.$) {
            case 'ClassChar': {
                const char = seq.value
                // c === char
                thisExpr = [t.stringLiteral(char)]
                break
            }
            case 'Group': {
                // c >= from && c <= to
                const from = seq.from.value.charCodeAt(0)
                const to = seq.to.value.charCodeAt(0)
                
                let chars: t.StringLiteral[] = []
                for (let i = from; i <= to; i++) {
                    chars.push(t.stringLiteral(String.fromCharCode(i)))
                }

                thisExpr = chars
                break
            }
            case "Named":
                // \r, \n, \t

                thisExpr =
                    [t.stringLiteral("\n"), t.stringLiteral("\r"), t.stringLiteral("\t"), t.stringLiteral("\b")];
                break
            case "SpecialClass":
                thisExpr =
                    [t.stringLiteral(compileEscape(seq))];
                break
            default:
                throw new Error(`Unsupported class: ${seq.$}`)
        }

        return prev.concat(thisExpr)
    }, [] as t.Expression[])

    if (!expr) {
        throw new Error(`Something went wrong"`)
    }

    return t.callExpression(
        t.identifier("appendClass"),
        [
            ctxName ?? t.identifier("ctx"),
            builderName,
            t.booleanLiteral(node.negated),
            t.arrayExpression(expr),
        ]
    )
}

// A = [a-z]
// const A = (ctx, b) => {
//     return appendClass(ctx, b, ['a'...'z'])
// }
export const generateClass = (node: g.Class): t.Statement[] => {
    const stmts: t.Statement[] = []
    const expr = compileClass(node, t.identifier("b"));
    stmts.push(t.returnStatement(expr))
    return stmts
}

function isLowerCase(str: string) {
    return str === str.toLowerCase() &&
        str !== str.toUpperCase();
}

// // Or = A | B
// const Or = (ctx: Context, b: Builder): boolean => {
//    const b2: Builder = []
// 
//    const choice = randomInt(0, 1)
//
//    choice === 0 && A(ctx, b2)
//    choice === 1 && B(ctx, b2)
// 
//    if (b2.length > 0) {
//        b.push(b2)
//    }
// }
export const generateAlt = (node: g.Alt): t.Statement[] => {
    const stmts: t.Statement[] = []
    
    // if (ctx.depth > ctx.maxDepth) {
    //     return
    // }
    stmts.push(t.ifStatement(
        t.binaryExpression(
            '>',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            t.memberExpression(t.identifier("ctx"), t.identifier("maxDepth"))
        ),
        t.blockStatement([
            t.returnStatement()
        ])
    ))

    // ctx.depth++
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '++',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))

    const [head, ...tail] = node.exprs
    if (!head) {
        throw new Error("Seq must have at least one clause")
    }

    // const choice = randomInt(0, 1)
    stmts.push(t.variableDeclaration(
        'const',
        [
            t.variableDeclarator(t.identifier("choice"), t.callExpression(
                t.identifier("randomInt"),
                [
                    t.numericLiteral(0),
                    t.numericLiteral(node.exprs.length - 1),
                ]
            ))
        ]
    ))

    // if (choice === 0) {
    //     A(ctx, b2)
    // }
    for (const [i, clause] of node.exprs.entries()) {
        stmts.push(t.ifStatement(
            t.binaryExpression(
                '===',
                t.identifier("choice"),
                t.numericLiteral(i)
            ),
            t.blockStatement([
                t.expressionStatement(generateClause(clause, undefined, t.identifier("b2")))
            ])
        ))
    }

    // ctx.depth--
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '--',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    stmts.push(storeNodeIfNotEmpty())

    return stmts
}

// Seq = A B
// const Seq = (ctx: Context, b: Builder): void => {
//     if (ctx.depth > ctx.maxDepth) {
//         return
//     }
//     ctx.depth++
//
//     const b2: Builder = []
//
//     A(ctx, b2)
//     B(ctx, b2)
//
//     if (b2.length > 0 {
//         b.push(b2)
//     }
//
//     ctx.depth--
// }
export const generateSeq = (node: g.Seq): t.Statement[] => {
    const stmts: t.Statement[] = []
    
    // if (ctx.depth > ctx.maxDepth) {
    //     return
    // }
    stmts.push(t.ifStatement(
        t.binaryExpression(
            '>',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            t.memberExpression(t.identifier("ctx"), t.identifier("maxDepth"))
        ),
        t.blockStatement([
            t.returnStatement()
        ])
    ))

    // ctx.depth++
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '++',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    // const b2: Builder = []
    stmts.push(createEmptyBuilder("b2"))

    const [head, ...tail] = node.clauses
    if (!head) {
        throw new Error("Seq must have at least one clause")
    }

    // A(ctx, b2)
    // B(ctx, b2)
    for (const clause of node.clauses) {
        stmts.push(t.expressionStatement(generateClause(clause.expr, clause.name, t.identifier("b2"))))
        stmts.push(generateSpaces())
    }

    // if (b2.length > 0 {
    //     b.push(b2)
    // }
    stmts.push(storeNodeIfNotEmpty())

    // ctx.depth--
    stmts.push(t.expressionStatement(
        t.updateExpression(
            '--',
            t.memberExpression(t.identifier("ctx"), t.identifier("depth")),
            false
        )
    ))

    return stmts
}

function compileAny(builderName: t.Expression, ctxName?: t.Expression) {
    return t.callExpression(t.identifier("appendAny"), [
        ctxName ?? t.identifier("ctx"),
        builderName,
    ]);
}

export const generateClause = (expr: g.Expr,
                               fieldName: undefined | string,
                               builderName: t.Expression,
                               ctxName?:
                               t.Expression): t.Expression => {
    switch (expr.$) {
        case 'Call': {
            const args: t.Expression[] = [
                ctxName ?? t.identifier("ctx"),
                builderName,
                ...(fieldName ? [t.stringLiteral(fieldName)] : []),
            ]
            return t.callExpression(compileCall(expr), args)
        }
        case 'Terminal':
            return compileTerminal(expr, builderName)
        case "Class":
            return compileClass(expr, builderName, ctxName)
        case "Any":
            return compileAny(builderName, ctxName)
        default:
            throw new Error(`Unsupported expr2: ${expr.$}`)
    }
}

const compileTerminal = (node: g.Terminal, builderName: t.Expression): t.Expression => {
    const body = node.value.map(char => compileChar(char)).join('');

    let value;
    try {
        value = JSON.parse(`"${body}"`)
    } catch (e) {
        value = body
    }

    const wrapped = t.stringLiteral(value);
    return emitCall('appendString', [t.identifier("ctx"), builderName, wrapped]);
};

const compileChar = (node: g.Escape | g.Special | g.Char): string => {
    switch (node.$) {
        case 'Char':
            return node.value;
        default:
            return compileEscape(node);
    }
};

const compileEscape = (node: g.Escape | g.Special | g.SpecialClass): string => {
    let expr = compileEscapeToString(node);

    const str = `"${expr}"`;

    try {
        return JSON.parse(str);
    } catch (e) {
        return str
    }
};

const compileEscapeToString = (node: g.Escape | g.Special | g.SpecialClass): string => {
    switch (node.$) {
        case 'Ascii':
            return `\\x${node.value}`;
        case 'Short':
            return `\\u${node.value}`;
        case 'Long':
            return `\\u{${node.value}}`;
        case 'Named':
            return `\\${node.value}`;
        case 'Special':
        case 'SpecialClass':
            return `\\${node.value}`;
    }
};

const emitCall = (name: string, args: t.Expression[], params?: t.TSType[]): t.Expression => {
    const result = t.callExpression(t.identifier(name), args);
    if (params && params.length > 0) {
        result.typeParameters = t.tsTypeParameterInstantiation(params);
    }
    return result;
};
