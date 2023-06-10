import { compileSerializedValue } from "../compile/compile.js"
import type { Domain } from "../utils/domains.js"
import { throwInternalError } from "../utils/errors.js"
import type { evaluate } from "../utils/generics.js"
import type { keySet } from "../utils/records.js"
import { entriesOf, isKeyOf } from "../utils/records.js"
import type { SerializedPrimitive } from "../utils/serialize.js"
import type { BasisNode } from "./basis/basis.js"
import type { ValueNode } from "./basis/value.js"
import type { SerializedPath } from "./disjoint.js"
import { Disjoint } from "./disjoint.js"
import { unknownPredicateNode } from "./predicate.js"
import type { PredicateNode } from "./predicate.js"
import type { TypeNode } from "./type.js"
import { typeNode } from "./type.js"

export type CaseKey<kind extends DiscriminantKind = DiscriminantKind> =
    DiscriminantKind extends kind ? string : DiscriminantKinds[kind] | "default"

export type Discriminant<kind extends DiscriminantKind = DiscriminantKind> = {
    readonly path: string[]
    readonly kind: kind
    readonly cases: DiscriminatedCases<kind>
}

export type DiscriminatedCases<
    kind extends DiscriminantKind = DiscriminantKind
> = {
    [caseKey in CaseKey<kind>]: TypeNode
}

type DiscriminantKey = `${SerializedPath}${DiscriminantKind}`

type CasesBySpecifier = {
    [k in DiscriminantKey]?: Record<string, PredicateNode[]>
}

export type DiscriminantKinds = {
    domain: Domain
    value: SerializedPrimitive
}

const discriminantKinds: keySet<DiscriminantKind> = {
    domain: true,
    value: true
}

export type DiscriminantKind = evaluate<keyof DiscriminantKinds>

const parseDiscriminantKey = (key: DiscriminantKey) => {
    const lastPathIndex = key.lastIndexOf("]")
    return [
        JSON.parse(key.slice(0, lastPathIndex + 1)),
        key.slice(lastPathIndex + 1)
    ] as [path: string[], kind: DiscriminantKind]
}

export const discriminate = (
    branches: PredicateNode[]
): Discriminant | undefined => {
    if (branches.length < 2) {
        return
    }
    const casesBySpecifier: CasesBySpecifier = {}
    for (let lIndex = 0; lIndex < branches.length - 1; lIndex++) {
        const l = branches[lIndex]
        for (let rIndex = lIndex + 1; rIndex < branches.length; rIndex++) {
            const r = branches[rIndex]
            const result = l.intersect(r)
            if (!(result instanceof Disjoint)) {
                continue
            }
            for (const { path, kind, disjoint } of result.flat) {
                if (!isKeyOf(kind, discriminantKinds)) {
                    continue
                }
                const qualifiedDiscriminant: DiscriminantKey = `${path}${kind}`
                let lSerialized: string
                let rSerialized: string
                if (kind === "domain") {
                    lSerialized = (disjoint.l as BasisNode).domain
                    rSerialized = (disjoint.r as BasisNode).domain
                } else if (kind === "value") {
                    lSerialized = compileSerializedValue(
                        (disjoint.l as ValueNode).rule
                    )
                    rSerialized = compileSerializedValue(
                        (disjoint.r as ValueNode).rule
                    )
                } else {
                    return throwInternalError(
                        `Unexpected attempt to discriminate disjoint kind '${kind}'`
                    )
                }
                if (!casesBySpecifier[qualifiedDiscriminant]) {
                    casesBySpecifier[qualifiedDiscriminant] = {
                        [lSerialized]: [l],
                        [rSerialized]: [r]
                    }
                    continue
                }
                const cases = casesBySpecifier[qualifiedDiscriminant]!
                if (!isKeyOf(lSerialized, cases)) {
                    cases[lSerialized] = [l]
                } else if (!cases[lSerialized].includes(l)) {
                    cases[lSerialized].push(l)
                }
                if (!isKeyOf(rSerialized, cases)) {
                    cases[rSerialized] = [r]
                } else if (!cases[rSerialized].includes(r)) {
                    cases[rSerialized].push(r)
                }
            }
        }
    }
    // TODO: determinstic? Update cache key?
    const bestDiscriminantEntry = entriesOf(casesBySpecifier)
        .sort((a, b) => Object.keys(a[1]).length - Object.keys(b[1]).length)
        .at(-1)
    if (!bestDiscriminantEntry) {
        return
    }
    const [specifier, predicateCases] = bestDiscriminantEntry
    const [path, kind] = parseDiscriminantKey(specifier)
    const discriminatedCases: DiscriminatedCases = {}
    for (const k in predicateCases) {
        let caseBranches: PredicateNode[] = []
        for (const branch of predicateCases[k]) {
            // TODO: fix
            const pruned = branch //.pruneDiscriminant(path, kind)
            if (pruned === null) {
                caseBranches = [unknownPredicateNode]
                break
            }
            caseBranches.push(pruned)
        }
        discriminatedCases[k] = typeNode(caseBranches)
    }
    return {
        kind,
        path,
        cases: discriminatedCases
    }
}

export const writeUndiscriminatableMorphUnionMessage = <path extends string>(
    path: path
) =>
    `${
        path === "/" ? "A" : `At ${path}, a`
    } union including one or more morphs must be discriminatable`
