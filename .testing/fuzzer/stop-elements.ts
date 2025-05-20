// StatementReturn     = keyword<"return"> expression:expression? semicolon;
// StatementExpression = expression:expression semicolon;
// StatementAssign     = left:expression operator:augmentedOp? "=" right:expression semicolon;
// StatementCondition  = keyword<"if"> condition:expression trueBranch:statements falseBranch:(keyword<"else"> @(FalseBranch / StatementCondition))?;
// StatementWhile      = keyword<"while"> condition:parens body:statements;
// StatementRepeat     = keyword<"repeat"> condition:parens body:statements;
// StatementUntil      = keyword<"do"> body:statements keyword<"until"> condition:parens semicolon;
// StatementTry        = keyword<"try"> body:statements handler:(keyword<"catch"> "(" name:Id ")" body:statements)?;
// StatementForEach    = keyword<"foreach"> "(" key:Id "," value:Id "in" expression:expression ")" body:statements;

// augmentedOp = "||" / "&&" / ">>" / "<<" / [-+*/%|&^];
// FalseBranch = body:statements;
// semicolon = ";" / &"}";

// destructItem = RegularField / PunnedField;
// RegularField = fieldName:Id ":" varName:Id;
// PunnedField = name:Id;

// optionalRest = "," @RestArgument / NoRestArgument;
// RestArgument = "..";
// NoRestArgument = ","?;

// expression   = Conditional;

// Conditional  = head:or tail:("?" thenBranch:or ":" elseBranch:Conditional)?;

// or           = Binary<and,          "||">;
// and          = Binary<bitwiseOr,    "&&">;
// bitwiseOr    = Binary<bitwiseXor,   "|">;
// bitwiseXor   = Binary<bitwiseAnd,   "^">;
// bitwiseAnd   = Binary<equality,     "&">;
// equality     = Binary<compare,      ("!=" / "==")>;
// compare      = Binary<bitwiseShift, ("<=" / "<" / ">=" / ">")>;
// bitwiseShift = Binary<add,          ("<<" / ">>")>;
// add          = Binary<mul,          ("+" / "-")>;
// mul          = Binary<Unary,        [*/%]>;

// Unary        = prefixes:Operator<[-+!~]>* expression:Suffix;
// Suffix       = expression:primary suffixes:suffix*;

// Binary<T, U> = exprs:inter<T, Operator<U>>;
// Operator<U>  = name:U;

// suffix
//     = SuffixUnboxNotNull
//     / SuffixCall
//     / SuffixFieldAccess;

// SuffixUnboxNotNull = "!!";
// SuffixCall = params:ParameterList<expression>;
// SuffixFieldAccess = "." name:Id;

// primary
//     = Parens
//     / StructInstance
//     / IntegerLiteral
//     / BoolLiteral
//     / InitOf
//     / CodeOf
//     / Null
//     / StringLiteral
//     / Id;

// Null = keyword<"null">;

// parens = "(" @expression ")";
// Parens = child:parens;

// StructInstance = type:TypeId StructInstanceFields;
// StructInstanceFields = "{" fields:commaList<StructFieldInitializer>? "}";
// InitOf = keyword<"initOf"> name:Id params:ParameterList<expression>;
// CodeOf = "codeOf" name:Id;

// StructFieldInitializer = name:Id init:(":" @expression)?;

// ParameterList<T> = "(" @commaList<T>? ")";
// Parameter = name:Id type:ascription;

// commaList<T> = @inter<T, ","> ","?;

// IntegerLiteral = value:(IntegerLiteralHex / IntegerLiteralBin / IntegerLiteralOct / IntegerLiteralDec);

// IntegerLiteralDec = digits:#underscored<digit>;
// IntegerLiteralHex = digits:#("0" [xX] @underscored<hexDigit>);
// IntegerLiteralBin = digits:#("0" [bB] @underscored<[01]>);
// IntegerLiteralOct = digits:#("0" [oO] @underscored<[0-7]>);
// underscored<T> = $(T ("_"? T)*);
// digit "digit" = [0-9];

// idPart "identifier character" = [a-zA-Z0-9_];
// Id "identifier" = name:#$(!reservedWord [a-zA-Z_] idPart*);


// FuncId "FunC identifier" = accessor:[.~]? id:$("`" [^`\r\n]+ "`" / [^ \t\r\n()[\],.;~]+);

// BoolLiteral = value:("true" / "false") !idPart;

// StringLiteral = value:#("\"" @$([^"\\] / "\\" @escapeChar)* "\"");

// escapeChar
//     = [\\"nrtvbf]
//     / "u{" @$(hexDigit hexDigit? hexDigit? hexDigit? hexDigit? hexDigit?) "}"
//     / "u" @$(hexDigit hexDigit hexDigit hexDigit)
//     / "x" @$(hexDigit hexDigit);

// hexDigit "hexadecimal digit" = [0-9a-fA-F];

// keyword<T> = #(@T !idPart);

// reservedWord "reserved word" = keyword<(
//     // extend and public are reserved for legacy reasons
//     "extend" / "public" /

//     "fun" / "let" / "return" / "receive" / "native" / "primitive" / "null" /
//     "if" / "else" / "while" / "repeat" / "do" / "until" / "try" / "catch" /
//     "foreach" / "as" / "map" / "mutates" / "extends" / "external" / "import" /
//     "with" / "trait" / "initOf" / "override" / "abstract" / "virtual" /
//     "inline" / "const"
// )>;

// space "space" = (#$([ \t\r\n]+) / Comment)+;
// Comment = multiLineComment / singleLineComment;
// multiLineComment = "/*" @$(!"*/" .)* "*/";
// singleLineComment = "//" @$[^\r\n]*;

// JustImports = imports:Import* .*;

// inter<A, B> = head:A tail:(op:B right:A)*;

export const stopElements: { [key: string]: string } = {
    "Module": "",
    "Import": "import\"empty_import\";",
    "moduleItem": "const module_item:Empty_type;",
    "contractItemDecl": "const contract_item:Empty_type;",
    "traitItemDecl": "const trait_item:Empty_type;",
    "PrimitiveTypeDecl": "primitive primitive_type;",
    "Function": "fun func();",
    "FunctionDefinition": "{}",
    "FunctionDeclaration": ";",
    "AsmFunction": "asm fun asm_func{}",
    "shuffle": "()",
    "NativeFunctionDecl": "@name(native_name) native native_func_decl();",
    "Constant": "const constant:Empty_type;",
    "ConstantAttribute": "virtual",
    "ConstantDefinition": "= 0;",
    "ConstantDeclaration": ";",
    "storageVar": "storage_var:Empty_type;",
    "StructDecl": "struct struct_decl{}",
    "MessageDecl": "message message_decl{}",
    "structFields": "struct_fields:Empty_type;",
    "FieldDecl": "field_decl:Empty_type;",
    "Contract": "contract contract_decl{}",
    "Trait": "trait trait_decl{}",
    "inheritedTraits": "with inherited_traits",
    "ContractInit": "init contract_init:Empty_type{}",
    "ContractAttribute": "interface(\"contract_interface\")",
    "FunctionAttribute": "mutates",
    "GetAttribute": "get()",
    "Receiver": "receive(){}",
    "ReceiverType": "bounced",
    "receiverParam": "param:Empty_type",
    "assembly": "{}",
    "assemblySequence": "{}",
    "assemblyItem": "{}",
    "ascription": ":Empty_type",
    "type": "Empty_type",
    "TypeAs": "Empty_type",
    "TypeOptional": "Empty_type",
    "typePrimary": "Empty_type",
    "TypeRegular": "Empty_type",
    "TypeGeneric": "Empty_type<T>",
    "MapKeyword": "map",
    "Bounced": "bounced",
    "TypeId": "Empty_type",
    "statement": "return;",
    "statements": "{}",
    "StatementLet": "let var:Empty_type = 0;",
    "StatementDestruct": "let struct_decl{field:Empty_type,..} = 0;",
    "StatementBlock": "{}",
    "StatementReturn": "return 0;",
    "StatementExpression": "0;",
    "StatementAssign": "statmentId || = 0;",
};
