import {
	constructorExtends,
	throwParseError,
	type extend,
	type optionalizeKeys
} from "@arktype/util"
import type { BasisKind } from "../bases/basis.js"
import { In } from "../io/compile.js"
import type { declareNode, withAttributes } from "../shared/declare.js"
import { defineNode } from "../shared/define.js"
import { Disjoint } from "../shared/disjoint.js"
import type { Node } from "../shared/node.js"
import type { RefinementAttachments } from "./refinement.js"
import { defineRefinement } from "./shared.js"

export type BoundInner = withAttributes<{
	readonly boundKind: BoundKind
	readonly exclusive?: boolean
}>

export type NormalizedBoundSchema = optionalizeKeys<BoundInner, "boundKind">

export type BoundLimit = number | string

export type BoundDeclaration = MinDeclaration | MaxDeclaration

export type BoundAttachments<limitKind extends LimitKind> = extend<
	RefinementAttachments<Boundable>,
	{
		comparator: RelativeComparator<limitKind>
	}
>

export const writeUnboundableMessage = <root extends string>(
	root: root
): writeUnboundableMessage<root> =>
	`Bounded expression ${root} must be a number, string, Array, or Date`

export type writeUnboundableMessage<root extends string> =
	`Bounded expression ${root} must be a number, string, Array, or Date`

export type MinInner = extend<
	BoundInner,
	{
		readonly min: number
	}
>

export type MinSchema =
	| BoundLimit
	| extend<
			NormalizedBoundSchema,
			{
				readonly min: BoundLimit
			}
	  >

export type MinDeclaration = declareNode<{
	kind: "min"
	schema: MinSchema
	inner: MinInner
	intersections: {
		min: "min"
	}
	attach: BoundAttachments<"min">
}>

export const MinImplementation = defineNode({
	kind: "min",
	keys: {
		min: {
			parse: (_) => +_
		},
		exclusive: {},
		boundKind: {}
	},
	intersections: {
		min: (l, r) => (l.min > r.min || (l.min === r.min && l.exclusive) ? l : r)
	},
	normalize: (schema, ctx) => {
		const boundKind = getBoundKind(ctx.basis)
		return typeof schema === "object"
			? { ...schema, boundKind }
			: { min: schema, boundKind }
	},
	writeInvalidBasisMessage: writeUnboundableMessage,
	writeDefaultDescription: (inner) => {
		const comparisonDescription =
			inner.boundKind === "date"
				? inner.exclusive
					? "after"
					: "at or after"
				: inner.exclusive
				  ? "more than"
				  : "at least"
		return `${comparisonDescription} ${inner.min}`
	},
	attach: (node) => {
		const comparator = `>${node.exclusive ? "" : "="}` as const
		return {
			comparator,
			condition: `${In} ${comparator} ${node.min}`,
			implicitBasis: node.cls.builtins[node.boundKind]
		}
	}
})

export type MaxInner = extend<
	BoundInner,
	{
		readonly max: number
	}
>

export type MaxSchema =
	| BoundLimit
	| extend<
			NormalizedBoundSchema,
			{
				readonly max: BoundLimit
			}
	  >

export type MaxDeclaration = declareNode<{
	kind: "max"
	schema: MaxSchema
	inner: MaxInner
	intersections: {
		max: "max"
		min: Disjoint | null
	}
	attach: BoundAttachments<"max">
}>

export const MaxImplementation = defineRefinement({
	kind: "max",
	keys: {
		max: {
			parse: (_) => +_
		},
		exclusive: {},
		boundKind: {}
	},
	intersections: {
		max: (l, r) => (l.max > r.max || (l.max === r.max && l.exclusive) ? l : r),
		min: (l, r) =>
			l.max < r.min || (l.max === r.min && (l.exclusive || r.exclusive))
				? Disjoint.from("bound", l, r)
				: null
	},
	normalize: (schema, ctx) => {
		const boundKind = getBoundKind(ctx.basis)
		return typeof schema === "object"
			? { ...schema, boundKind }
			: { max: schema, boundKind }
	},
	writeInvalidBasisMessage: writeUnboundableMessage,
	writeDefaultDescription: (inner) => {
		const comparisonDescription =
			inner.boundKind === "date"
				? inner.exclusive
					? "before"
					: "at or before"
				: inner.exclusive
				  ? "less than"
				  : "at most"
		return `${comparisonDescription} ${inner.max}`
	},
	attach: (node) => {
		const comparator = `<${node.exclusive ? "" : "="}` as const
		return {
			comparator,
			condition: `${In} ${comparator} ${node.max}`,
			implicitBasis: node.cls.builtins[node.boundKind]
		}
	}
})

const getBoundKind = (basis: Node<BasisKind> | undefined): BoundKind => {
	if (basis === undefined) {
		return throwParseError(writeUnboundableMessage("unknown"))
	}
	if (basis.domain === "number" || basis.domain === "string") {
		return basis.domain
	}
	if (
		(basis.kind === "unit" && basis.is instanceof Array) ||
		(basis.kind === "proto" && constructorExtends(basis.proto, Array))
	) {
		return "array"
	}
	if (
		(basis.kind === "unit" && basis.is instanceof Date) ||
		(basis.kind === "proto" && constructorExtends(basis.proto, Date))
	) {
		return "date"
	}
	return throwParseError(writeUnboundableMessage(basis.basisName))
}

const unitsByBoundKind = {
	date: "",
	number: "",
	string: "characters",
	array: "elements"
} as const

export type BoundKind = keyof typeof unitsByBoundKind

export type LimitKind = "min" | "max"

export type RelativeComparator<kind extends LimitKind = LimitKind> = {
	min: ">" | ">="
	max: "<" | "<="
}[kind]

export const writeIncompatibleRangeMessage = (l: BoundKind, r: BoundKind) =>
	`Bound kinds ${l} and ${r} are incompatible`

export type NumericallyBoundable = string | number | readonly unknown[]

export type Boundable = NumericallyBoundable | Date
