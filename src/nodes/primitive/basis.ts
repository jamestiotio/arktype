import type {
    AbstractableConstructor,
    Domain,
    extend,
    inferDomain
} from "@arktype/utils"
import { constructorExtends, throwInternalError } from "@arktype/utils"
import type { NodeKind, NodeKinds } from "../base.js"
import { NodeBase } from "../base.js"
import type { DisjointKindEntries } from "../disjoint.js"
import { Disjoint } from "../disjoint.js"
import type { TypeNode } from "../type.js"
import type { NonEnumerableDomain } from "./domain.js"

export type BasisKind = extend<NodeKind, "domain" | "class" | "unit">

export type BasisNode = NodeKinds[BasisKind]

export abstract class BasisNodeBase extends NodeBase {
    abstract override kind: BasisKind
    abstract domain: Domain
    abstract literalKeys: PropertyKey[]

    intersect(this: BasisNode, other: BasisNode): BasisNode | Disjoint {
        if (this.hasKind("class") && other.hasKind("class")) {
            return constructorExtends(this.rule, other.rule)
                ? this
                : constructorExtends(other.rule, this.rule)
                ? other
                : Disjoint.from("class", this, other)
        }
        const disjointEntries: DisjointKindEntries = []
        if (this.domain !== other.domain) {
            disjointEntries.push(["domain", { l: this, r: other }])
        }
        if (this.hasKind("unit") && other.hasKind("unit")) {
            if (this.rule !== other.rule) {
                disjointEntries.push(["unit", { l: this, r: other }])
            }
        }
        return disjointEntries.length
            ? Disjoint.fromEntries(disjointEntries)
            : basisPrecedenceByKind[this.kind] <
              basisPrecedenceByKind[other.kind]
            ? this
            : basisPrecedenceByKind[other.kind] <
              basisPrecedenceByKind[this.kind]
            ? other
            : throwInternalError(
                  `Unexpected non-disjoint intersection from basis nodes with equal precedence ${this} and ${other}`
              )
    }

    keyof(): TypeNode {
        // TODO: node.literal(...literalKeys))
        return {} as never
    }
}

export type BasisInput<kind extends BasisKind = BasisKind> = {
    domain: NonEnumerableDomain
    class: AbstractableConstructor
    unit: readonly [unknown]
}[kind]

export type inferBasis<basis extends BasisInput> = basis extends Domain
    ? inferDomain<basis>
    : basis extends AbstractableConstructor<infer instance>
    ? instance
    : basis extends readonly [infer unit]
    ? unit
    : never

export const basisPrecedenceByKind: Record<BasisKind, number> = {
    unit: 0,
    class: 1,
    domain: 2
}
