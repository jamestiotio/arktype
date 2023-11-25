import {
	listFrom,
	throwParseError,
	type Constructor,
	type evaluate,
	type exactMessageOnError,
	type listable
} from "@arktype/util"
import type { Node } from "../base.js"
import type { BasisKind, instantiateBasis } from "../bases/basis.js"
import type { NonEnumerableDomain } from "../bases/domain.js"
import type { CheckResult, Problem, Problems } from "../shared/compilation.js"
import type { declareNode, withAttributes } from "../shared/declare.js"
import { basisKinds, defineNode } from "../shared/define.js"
import { Disjoint } from "../shared/disjoint.js"
import type { Definition, NormalizedDefinition } from "../shared/nodes.js"
import type {
	IntersectionDefinition,
	instantiateIntersectionSchema,
	validateIntersectionSchema
} from "./intersection.js"

export type ValidatorKind = evaluate<"intersection" | BasisKind>

export type ValidatorNode = Node<ValidatorKind>

export type ValidatorDefinition = Definition<ValidatorKind>

export type validateValidatorSchema<def> = [def] extends [
	NonEnumerableDomain | Constructor
]
	? def
	: def extends NormalizedDefinition<BasisKind>
	  ? exactMessageOnError<def, NormalizedDefinition<keyof def & BasisKind>>
	  : def extends IntersectionDefinition
	    ? validateIntersectionSchema<def>
	    : ValidatorDefinition

export type instantiateValidatorSchema<def> = def extends Definition<BasisKind>
	? instantiateBasis<def>
	: def extends IntersectionDefinition
	  ? instantiateIntersectionSchema<def>
	  : Node<ValidatorKind>

export type TraversalState = {
	path: string[]
	problems: Problems
}

export type Morph<i = any, o = unknown> = (In: i, state: TraversalState) => o

export type Out<o = any> = ["=>", o]

export type MorphInner = withAttributes<{
	readonly in: ValidatorNode
	readonly out?: ValidatorNode
	readonly morph: readonly Morph[]
}>

export type MorphDefinition = withAttributes<{
	readonly in: ValidatorDefinition
	readonly out?: ValidatorDefinition
	readonly morph: listable<Morph>
}>

export type MorphAttachments = {
	inCache: ValidatorNode
	outCache: ValidatorNode
}

export type MorphDeclaration = declareNode<{
	kind: "morph"
	schema: MorphDefinition
	inner: MorphInner
	intersections: {
		morph: "morph" | Disjoint
		intersection: "morph" | Disjoint
		default: "morph" | Disjoint
	}
	attach: MorphAttachments
}>

// TODO: recursively extract in
export const MorphImplementation = defineNode({
	kind: "morph",
	keys: {
		in: {
			parse: (schema, ctx) =>
				ctx.scope.schemaWithKindIn(["intersection", ...basisKinds], schema)
		},
		out: {
			parse: (schema, ctx) =>
				ctx.scope.schemaWithKindIn(["intersection", ...basisKinds], schema)
		},
		morph: {
			parse: listFrom
		}
	},
	normalize: (schema) => schema,
	intersections: {
		morph: (l, r) => {
			if (l.morph.some((morph, i) => morph !== r.morph[i])) {
				// TODO: is this always a parse error? what about for union reduction etc.
				// TODO: check in for union reduction
				return throwParseError(`Invalid intersection of morphs`)
			}
			const inTersection = l.in.intersect(r.in)
			if (inTersection instanceof Disjoint) {
				return inTersection
			}
			const outTersection = l.out.intersect(r.out)
			if (outTersection instanceof Disjoint) {
				return outTersection
			}
			return {
				morph: l.morph,
				in: inTersection,
				out: outTersection
			}
		},
		intersection: (l, r) => {
			const inTersection = l.in.intersect(r)
			return inTersection instanceof Disjoint
				? inTersection
				: {
						...l.inner,
						in: inTersection
				  }
		},
		default: (l, r) => {
			const constrainedInput = l.in.intersect(r)
			return constrainedInput instanceof Disjoint
				? constrainedInput
				: {
						...l.inner,
						in: constrainedInput
				  }
		}
	},
	writeDefaultDescription: (node) =>
		`a morph from ${node.inner.in} to ${node.inner.out}`,
	attach: (node) => ({
		inCache: node.inner.in,
		outCache: node.inner.out ?? node.cls.builtins.unknown
	}),
	compile: () => `return true`
})

export type inferMorphOut<out> = out extends CheckResult<infer t>
	? out extends null
		? // avoid treating any/never as CheckResult
		  out
		: t
	: Exclude<out, Problem>

export type validateMorphSchema<def> = {
	[k in keyof def]: k extends "in" | "out"
		? validateValidatorSchema<def[k]>
		: k extends keyof MorphDefinition
		  ? MorphDefinition[k]
		  : `'${k & string}' is not a valid morph schema key`
}

export type parseMorphSchema<def> = def extends MorphDefinition
	? Node<
			"morph",
			(
				In: def["in"] extends {}
					? instantiateValidatorSchema<def["in"]>["infer"]
					: unknown
			) => def["out"] extends {}
				? Out<instantiateValidatorSchema<def["out"]>["infer"]>
				: def["morph"] extends
							| Morph<any, infer o>
							| readonly [...unknown[], Morph<any, infer o>]
				  ? Out<inferMorphOut<o>>
				  : never
	  >
	: never
