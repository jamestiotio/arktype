import type { Dict, evaluate, extend } from "@arktype/util"
import type { RefinementOperand } from "../refinements/refinement.js"
import type { Problems } from "./compilation.js"
import type { ConstraintKind, NodeKind, RefinementKind } from "./define.js"
import type { Disjoint } from "./disjoint.js"
import type { rightOf } from "./intersect.js"

export type BaseAttributes = {
	readonly description?: string
}

export type withAttributes<o extends object> = extend<BaseAttributes, o>

export type BaseIntersectionMap = {
	[lKey in NodeKind]: evaluate<
		{
			[requiredKey in lKey]:
				| lKey
				| Disjoint
				| (lKey extends RefinementKind ? null : never)
		} & {
			[rKey in rightOf<lKey> | "default"]?:
				| lKey
				| Disjoint
				| (lKey extends ConstraintKind ? null : never)
		}
	>
}

export type InputData<kind extends NodeKind> = kind extends RefinementKind
	? RefinementOperand<kind>
	: unknown

export type NodeAttachments<kind extends NodeKind> = {
	traverseAllows: TraverseAllows<kind>
	traverseApply: TraverseApply<kind>
}

export type TraverseAllows<kind extends NodeKind> = (
	data: InputData<kind>,
	problems: Problems
) => boolean

export type TraverseApply<kind extends NodeKind> = (
	data: InputData<kind>,
	problems: Problems
) => void

export type DeclarationInput<kind extends NodeKind> = {
	kind: kind
	schema: unknown
	normalizedSchema: Dict
	inner: Dict
	meta: BaseAttributes
	intersections: BaseIntersectionMap[kind]
	attach: Dict
}

export type BaseNodeDeclaration = {
	kind: NodeKind
	schema: unknown
	normalizedSchema: Dict
	inner: Dict
	meta: BaseAttributes & { [k: string]: unknown }
	intersections: {
		[k in NodeKind | "default"]?: NodeKind | Disjoint | null
	}
	attach: Dict
}

export type validateNodeDeclaration<types, additionalKeys = never> = {
	[k in keyof DeclarationInput<any>]: types extends {
		kind: infer kind extends NodeKind
	}
		? DeclarationInput<kind>[k]
		: never
} & {
	[k in Exclude<
		keyof types,
		keyof BaseNodeDeclaration | additionalKeys
	>]?: never
}

export type declareNode<types extends validateNodeDeclaration<types>> = types
