import type { Dict, evaluate, extend } from "@arktype/util"
import type { NarrowedAttachments } from "../base.js"
import type { Declaration, OpenRefinementKind } from "../kinds.js"
import type {
	ConstraintKind,
	NodeKind,
	PrimitiveKind,
	PropKind,
	SetKind
} from "./define.js"
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
				| (lKey extends OpenRefinementKind ? null : never)
		} & {
			[rKey in rightOf<lKey> | "default"]?:
				| lKey
				| Disjoint
				| (lKey extends ConstraintKind ? null : never)
		}
	>
}

export type UnknownIntersections = {
	[rKey in NodeKind | "default"]?: NodeKind | Disjoint | null
}

export type DeclarationInput = {
	kind: NodeKind
	schema: unknown
	normalizedSchema: BaseAttributes
	inner: Dict
	meta?: Dict
	prerequisite?: unknown
	childKind?: NodeKind
	intersections: UnknownIntersections
}

type ParentsByKind = {
	[k in NodeKind]: {
		[pKind in NodeKind]: k extends Declaration<k>["childKind"] ? pKind : never
	}[NodeKind]
}

type parentKindOf<kind extends NodeKind> = ParentsByKind[kind]

export type declareNode<d extends DeclarationInput> = extend<
	d,
	{
		meta: "meta" extends keyof d
			? extend<BaseAttributes, d["meta"]>
			: BaseAttributes
		prerequisite: "prerequisite" extends keyof d ? d["prerequisite"] : unknown
		childKind: "childKind" extends keyof d ? d["childKind"] : never
		parentKind: parentKindOf<d["kind"]>
	}
>

export type attachmentsOf<d extends BaseNodeDeclaration> =
	NarrowedAttachments<d> & d["inner"]

export type BaseNodeDeclaration = {
	kind: NodeKind
	schema: unknown
	normalizedSchema: Dict & BaseAttributes
	meta: Dict & BaseAttributes
	inner: Dict
	prerequisite: any
	childKind: NodeKind
	parentKind: SetKind | PropKind
	intersections: {
		[k in NodeKind | "default"]?: NodeKind | Disjoint | null
	}
}

export interface PrimitiveNode {
	readonly kind: PrimitiveKind
	readonly compiledActual?: string
	readonly compiledCondition: string
	readonly compiledNegation: string
}
