import {
	builtins,
	type BoundKind,
	type LimitValue,
	type Root,
	type Schema
} from "@arktype/schema"
import {
	isKeyOf,
	throwParseError,
	tryParseNumber,
	type keySet
} from "@arktype/util"
import type { astToString } from "../../../semantic/utils.js"
import type {
	DynamicState,
	DynamicStateWithRoot
} from "../../reduce/dynamic.js"
import {
	writeUnpairableComparatorMessage,
	type OpenLeftBound
} from "../../reduce/shared.js"
import type { StaticState, state } from "../../reduce/static.js"
import {
	extractDateLiteralSource,
	isDateLiteral,
	type DateLiteral
} from "../operand/date.js"
import { parseOperand } from "../operand/operand.js"
import type { Scanner } from "../scanner.js"

export const parseBound = (
	s: DynamicStateWithRoot,
	start: ComparatorStartChar
) => {
	const comparator = shiftComparator(s, start)
	if (s.root.kind === "unit") {
		if (typeof s.root.is === "number") {
			s.unsetRoot()
			return s.reduceLeftBound(s.root.is, comparator)
		}
		if (s.root.is instanceof Date) {
			s.unsetRoot()
			const literal = `d'${
				s.root.description ?? s.root.is.toISOString()
			}'` as const
			return s.reduceLeftBound(literal, comparator)
		}
	}
	return parseRightBound(s, comparator)
}

export type parseBound<
	s extends StaticState,
	start extends ComparatorStartChar,
	unscanned extends string,
	$,
	args
> = shiftComparator<start, unscanned> extends infer shiftResultOrError
	? shiftResultOrError extends Scanner.shiftResult<
			infer comparator extends Comparator,
			infer nextUnscanned
	  >
		? s["root"] extends `${infer limit extends LimitLiteral}`
			? state.reduceLeftBound<s, limit, comparator, nextUnscanned>
			: parseRightBound<state.scanTo<s, nextUnscanned>, comparator, $, args>
		: shiftResultOrError
	: never

export const minComparators = {
	">": true,
	">=": true
} as const

export type MinComparator = keyof typeof minComparators

export const maxComparators = {
	"<": true,
	"<=": true
} as const

export type MaxComparator = keyof typeof maxComparators

export const comparators = {
	...minComparators,
	...maxComparators,
	"==": true
}

export type Comparator = keyof typeof comparators

export type LimitLiteral = number | DateLiteral

const oneCharComparators = {
	"<": true,
	">": true
} as const

type OneCharComparator = keyof typeof oneCharComparators

export type ComparatorStartChar = Comparator extends `${infer char}${string}`
	? char
	: never

export const comparatorStartChars: keySet<ComparatorStartChar> = {
	"<": 1,
	">": 1,
	"=": 1
}

const shiftComparator = (
	s: DynamicState,
	start: ComparatorStartChar
): Comparator =>
	s.scanner.lookaheadIs("=")
		? `${start}${s.scanner.shift()}`
		: isKeyOf(start, oneCharComparators)
		  ? start
		  : s.error(singleEqualsMessage)

type shiftComparator<
	start extends ComparatorStartChar,
	unscanned extends string
> = unscanned extends `=${infer nextUnscanned}`
	? [`${start}=`, nextUnscanned]
	: start extends OneCharComparator
	  ? [start, unscanned]
	  : state.error<singleEqualsMessage>

export const writeUnboundableMessage = <root extends string>(
	root: root
): writeUnboundableMessage<root> =>
	`Bounded expression ${root} must be a number, string, Array, or Date`

export type writeUnboundableMessage<root extends string> =
	`Bounded expression ${root} must be a number, string, Array, or Date`

export const writeIncompatibleRangeMessage = (l: BoundKind, r: BoundKind) =>
	`Bound kinds ${l} and ${r} are incompatible`

export const writeLimitMismatchMessage = (
	root: string,
	limitValue: LimitValue
) => `Limit '${limitValue}' cannot bound ${root}`

export const getBoundKinds = (
	comparator: Comparator,
	limit: LimitValue,
	root: Root
): BoundKind[] => {
	if (root.extends(builtins.number)) {
		if (typeof limit !== "number") {
			return throwParseError(writeLimitMismatchMessage(root.toString(), limit))
		}
		return comparator === "=="
			? ["min", "max"]
			: comparator[0] === ">"
			  ? ["min"]
			  : ["max"]
	}
	if (root.extends(builtins.string) || root.extends(builtins.array)) {
		if (typeof limit !== "number") {
			return throwParseError(writeLimitMismatchMessage(root.toString(), limit))
		}
		return comparator === "=="
			? ["minLength", "maxLength"]
			: comparator[0] === ">"
			  ? ["minLength"]
			  : ["maxLength"]
	}
	if (root.extends(builtins.date)) {
		// allow either numeric or date limits
		return comparator === "=="
			? ["after", "before"]
			: comparator[0] === ">"
			  ? ["after"]
			  : ["before"]
	}
	return throwParseError(writeUnboundableMessage(root.toString()))
}

export const singleEqualsMessage = `= is not a valid comparator. Use == to check for equality`
type singleEqualsMessage = typeof singleEqualsMessage

const openLeftBoundToSchema = (
	leftBound: OpenLeftBound
): Schema<BoundKind> => ({
	limit: isDateLiteral(leftBound.limit)
		? extractDateLiteralSource(leftBound.limit)
		: leftBound.limit,
	exclusive: leftBound.comparator.length === 1
})

export const parseRightBound = (
	s: DynamicStateWithRoot,
	comparator: Comparator
) => {
	// store the node that will be bounded
	const previousRoot = s.unsetRoot()
	const previousScannerIndex = s.scanner.location
	parseOperand(s)
	// after parsing the next operand, use the locations to get the
	// token from which it was parsed
	const limitToken = s.scanner.sliceChars(
		previousScannerIndex,
		s.scanner.location
	)
	s.setRoot(previousRoot)
	const limit =
		tryParseNumber(limitToken) ??
		(isDateLiteral(limitToken)
			? extractDateLiteralSource(limitToken)
			: s.error(writeInvalidLimitMessage(comparator, limitToken, "right")))
	// apply the newly-parsed right bound
	const exclusive = comparator.length === 1
	// if the comparator is ==, both the min and max of that pair will be applied
	for (const kind of getBoundKinds(comparator, limit, previousRoot)) {
		s.constrainRoot(kind, { limit, exclusive })
	}
	if (!s.branches.leftBound) {
		return
	}
	// if there's an open left bound, perform additional validation and apply it
	if (!isKeyOf(comparator, maxComparators)) {
		return s.error(writeUnpairableComparatorMessage(comparator))
	}
	s.constrainRoot("min", openLeftBoundToSchema(s.branches.leftBound))
	delete s.branches.leftBound
}

export type parseRightBound<
	s extends StaticState,
	comparator extends Comparator,
	$,
	args
> = parseOperand<s, $, args> extends infer nextState extends StaticState
	? nextState["root"] extends `${infer limit extends LimitLiteral}`
		? s["branches"]["leftBound"] extends {}
			? comparator extends MaxComparator
				? state.reduceRange<
						s,
						s["branches"]["leftBound"]["limit"],
						s["branches"]["leftBound"]["comparator"],
						comparator,
						limit,
						nextState["unscanned"]
				  >
				: state.error<writeUnpairableComparatorMessage<comparator>>
			: state.reduceSingleBound<s, comparator, limit, nextState["unscanned"]>
		: state.error<
				writeInvalidLimitMessage<
					comparator,
					astToString<nextState["root"]>,
					"right"
				>
		  >
	: never

export const writeInvalidLimitMessage = <
	comparator extends Comparator,
	limit extends string | number,
	boundKind extends BoundExpressionKind
>(
	comparator: comparator,
	limit: limit,
	boundKind: boundKind
): writeInvalidLimitMessage<comparator, limit, boundKind> =>
	`Comparator ${comparator} must be ${
		boundKind === "left" ? "preceded" : ("followed" as any)
	} by a corresponding literal (was '${limit}')`

export type writeInvalidLimitMessage<
	comparator extends Comparator,
	limit extends string | number,
	boundKind extends BoundExpressionKind
> = `Comparator ${comparator} must be ${boundKind extends "left"
	? "preceded"
	: "followed"} by a corresponding literal (was '${limit}')`

export type BoundExpressionKind = "left" | "right"

export const invertedComparators = {
	"<": ">",
	">": "<",
	"<=": ">=",
	">=": "<=",
	"==": "=="
} as const satisfies Record<Comparator, Comparator>

export type InvertedComparators = typeof invertedComparators
