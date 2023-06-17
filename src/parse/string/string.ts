import type { ParseContext } from "../../scope.js"
import { type error, throwParseError } from "../../utils/errors.js"
import { type inferAst, writeUnsatisfiableExpressionError } from "../ast/ast.js"
import type { DynamicStateWithRoot } from "./reduce/dynamic.js"
import { DynamicState } from "./reduce/dynamic.js"
import type { state, StaticState } from "./reduce/static.js"
import { parseOperand } from "./shift/operand/operand.js"
import type { writeUnexpectedCharacterMessage } from "./shift/operator/operator.js"
import { parseOperator } from "./shift/operator/operator.js"

export const parseString = (def: string, ctx: ParseContext) =>
    fullStringParse(def, ctx)

// TODO: reenable or remove
// ctx.scope.maybeResolve(def, ctx) ??
// ((def.endsWith("[]") &&
//     ctx.scope.maybeResolve(def.slice(0, -2), ctx)?.array()) ||
//     fullStringParse(def, ctx))

/**
 * Try to parse the definition from right to left using the most common syntax.
 * This can be much more efficient for simple definitions.
 */
export type parseString<def extends string, $> = def extends keyof $
    ? def
    : def extends `${infer child}[]`
    ? child extends keyof $
        ? [child, "[]"]
        : fullStringParse<def, $>
    : fullStringParse<def, $>

export type inferString<def extends string, $> = inferAst<
    parseString<def, $>,
    $
>

export const fullStringParse = (def: string, ctx: ParseContext) => {
    const s = new DynamicState(def, ctx)
    parseOperand(s)
    const result = parseUntilFinalizer(s).root
    return result.isNever()
        ? throwParseError(writeUnsatisfiableExpressionError(def))
        : result
}

type fullStringParse<def extends string, $> = extractFinalizedResult<
    parseUntilFinalizer<state.initialize<def>, $>
>

export const parseUntilFinalizer = (s: DynamicState) => {
    while (s.finalizer === undefined) {
        next(s)
    }
    return s as DynamicStateWithRoot
}

export type parseUntilFinalizer<
    s extends StaticState,
    $
> = s["finalizer"] extends undefined ? parseUntilFinalizer<next<s, $>, $> : s

const next = (s: DynamicState) =>
    s.hasRoot() ? parseOperator(s) : parseOperand(s)

type next<s extends StaticState, $> = s["root"] extends undefined
    ? parseOperand<s, $>
    : parseOperator<s>

export type extractFinalizedResult<s extends StaticState> =
    s["finalizer"] extends error
        ? s["finalizer"]
        : s["finalizer"] extends ""
        ? s["root"]
        : error<writeUnexpectedCharacterMessage<`${s["finalizer"]}`>>
