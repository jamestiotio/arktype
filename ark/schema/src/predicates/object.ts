import type { extend } from "@arktype/util"
import type {
	ConstraintsRecord,
	DomainConstraints
} from "../constraints/constraint.js"
import type { ConstructorConstraint } from "../constraints/constructor.js"
import { PredicateNode } from "./predicate.js"

export type ObjectConstraints<constraints extends ConstraintsRecord> = extend<
	DomainConstraints,
	{
		readonly instanceOf?: ConstructorConstraint
	} & constraints
>

export class ObjectNode<
	constraints extends ObjectConstraints<ConstraintsRecord>
> extends PredicateNode<constraints> {
	readonly domain = "object"

	override writeDefaultBaseDescription() {
		return "an object"
	}
}
