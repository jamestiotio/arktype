import { Node } from "../node.ts"
import type { DivisorRule } from "./divisor.ts"
import type { InstanceRule } from "./instance.ts"
import type { NarrowRule } from "./narrow.ts"
import type { RangeNode } from "./range.ts"
import type { RegexNode } from "./regex.ts"
import type { EqualityRule } from "./value.ts"

export abstract class RuleNode<kind extends RuleKind = RuleKind> extends Node<
    RuleKinds[kind]
> {
    constructor(public readonly kind: kind, id: string) {
        super(id)
    }

    get precedence() {
        return precedenceByRule[this.kind]
    }
}

type RuleKinds = {
    value: EqualityRule
    instance: InstanceRule
    range: RangeNode
    divisor: DivisorRule
    regex: RegexNode
    props: RegexNode
    narrow: NarrowRule
}

export type RuleKind = keyof RuleKinds

const precedenceByRule = {
    value: 0,
    instance: 1,
    range: 2,
    divisor: 3,
    regex: 4,
    props: 5,
    narrow: 6
} as const satisfies Record<RuleKind, number>

export type PrecedenceByRule = typeof precedenceByRule

export const intersectUniqueLists = <item>(
    l: readonly item[],
    r: readonly item[]
) => {
    const intersection = [...l]
    for (const item of r) {
        if (!l.includes(item)) {
            intersection.push(item)
        }
    }
    return intersection
}
