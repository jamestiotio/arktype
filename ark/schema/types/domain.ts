import { domainOf, type Domain } from "@arktype/util"
import type { declareNode, withBaseMeta } from "../shared/declare.js"
import type { NodeImplementation } from "../shared/define.js"
import { Disjoint } from "../shared/disjoint.js"
import { BaseBasis } from "./basis.js"

export type DomainInner<
	domain extends NonEnumerableDomain = NonEnumerableDomain
> = withBaseMeta<{
	readonly domain: domain
}>

// only domains with an infinite number of values are allowed as bases
export type NonEnumerableDomain = keyof typeof nonEnumerableDomainDescriptions

export type DomainSchema<
	domain extends NonEnumerableDomain = NonEnumerableDomain
> = domain | NormalizedDomainSchema<domain>

export type NormalizedDomainSchema<
	domain extends NonEnumerableDomain = NonEnumerableDomain
> = DomainInner<domain>

export type DomainDeclaration = declareNode<{
	kind: "domain"
	schema: DomainSchema
	normalizedSchema: NormalizedDomainSchema
	inner: DomainInner
	intersections: {
		domain: "domain" | Disjoint
	}
	error: {}
}>

export class DomainNode<t = unknown> extends BaseBasis<
	t,
	DomainDeclaration,
	typeof DomainNode
> {
	static implementation: NodeImplementation<DomainDeclaration> = {
		collapseKey: "domain",
		keys: {
			domain: {}
		},
		normalize: (input) =>
			typeof input === "string" ? { domain: input } : input,
		defaults: {
			describe(inner) {
				return domainDescriptions[inner.domain]
			}
			// describeActual(data) {
			// 	return domainOf(data)
			// }
		},
		intersections: {
			domain: (l, r) => Disjoint.from("domain", l, r)
		}
	}

	basisName = this.domain

	compiledActual = ""

	compiledCondition =
		this.domain === "object"
			? `((typeof ${this.$.dataName} === "object" && ${this.$.dataName} !== null) || typeof ${this.$.dataName} === "function")`
			: `typeof ${this.$.dataName} === "${this.domain}"`

	compiledNegation =
		this.domain === "object"
			? `((typeof ${this.$.dataName} !== "object" || ${this.$.dataName} === null) && typeof ${this.$.dataName} !== "function")`
			: `typeof ${this.$.dataName} !== "${this.domain}"`

	traverseAllows = (data: unknown) => domainOf(data) === this.domain
}

const enumerableDomainDescriptions = {
	boolean: "boolean",
	null: "null",
	undefined: "undefined"
} as const

const nonEnumerableDomainDescriptions = {
	bigint: "a bigint",
	number: "a number",
	object: "an object",
	string: "a string",
	symbol: "a symbol"
} as const

/** Each domain's completion for the phrase "Must be _____" */
export const domainDescriptions = {
	...nonEnumerableDomainDescriptions,
	...enumerableDomainDescriptions
} satisfies Record<Domain, string>
