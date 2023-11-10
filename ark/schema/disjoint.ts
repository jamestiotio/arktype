import type { entryOf } from "@arktype/util"
import {
	entriesOf,
	fromEntries,
	stringify,
	throwInternalError,
	throwParseError,
	transform
} from "@arktype/util"
import { type BaseNode, type rightOf } from "./base.js"
import { type Node, type RuleKind } from "./nodes.js"

type DisjointKinds = {
	domain?: {
		l: BaseNode<"domain">
		r: BaseNode<"domain">
	}
	unit?: {
		l: BaseNode<"unit">
		r: BaseNode<"unit">
	}
	proto?: {
		l: BaseNode<"proto">
		r: BaseNode<"proto">
	}
	// TODO: test
	presence?:
		| {
				l: true
				r: false
		  }
		| {
				l: false
				r: true
		  }
	bound?: {
		l: BaseNode<"min" | "max">
		r: BaseNode<"min" | "max">
	}
	assignability?:
		| {
				l: unknown
				r: BaseNode<RuleKind>
		  }
		| {
				l: BaseNode<RuleKind>
				r: unknown
		  }
	union?: {
		l: readonly BaseNode<rightOf<"union">>[]
		r: readonly BaseNode<rightOf<"union">>[]
	}
	indiscriminableMorphs?: {
		l: BaseNode<"union">
		r: BaseNode<"union">
	}
	interesectedMorphs?: {
		l: BaseNode<"morph">
		r: BaseNode<"morph">
	}
}

export type DisjointKindEntries = entryOf<DisjointKinds>[]

export type SerializedPath = `[${string}]`

export type DisjointsSources = {
	[k in `${SerializedPath}`]: DisjointsAtPath
}

export type DisjointsAtPath = {
	[kind in DisjointKind]?: DisjointKinds[kind]
}

export type DisjointSourceEntry = entryOf<DisjointsSources>

export type DisjointKind = keyof DisjointKinds

export class Disjoint {
	constructor(public sources: DisjointsSources) {}

	static from<kind extends DisjointKind>(
		kind: kind,
		l: Required<DisjointKinds>[kind]["l"],
		r: Required<DisjointKinds>[kind]["r"]
	) {
		return new Disjoint({
			"[]": {
				[kind]: {
					l,
					r
				}
			}
		})
	}

	static fromEntries(entries: DisjointKindEntries) {
		if (!entries.length) {
			return throwInternalError(
				`Unexpected attempt to create a disjoint from no entries`
			)
		}
		return new Disjoint({ "[]": fromEntries(entries) })
	}

	get flat() {
		return entriesOf(this.sources).flatMap(([path, disjointKinds]) =>
			entriesOf(disjointKinds).map(([kind, disjoint]) => ({
				path,
				kind,
				disjoint
			}))
		)
	}

	describeReasons() {
		const reasons = this.flat
		if (reasons.length === 1) {
			const { path, disjoint } = reasons[0]
			const pathString = JSON.parse(path).join(".")
			return `Intersection${pathString && ` at ${pathString}`} of ${
				disjoint.l
			} and ${disjoint.r} results in an unsatisfiable type`
		}
		return `The following intersections result in unsatisfiable types:\n• ${reasons
			.map(({ path, disjoint }) => `${path}: ${disjoint.l} and ${disjoint.r}`)
			.join("\n• ")}`
	}

	throw() {
		return throwParseError(this.describeReasons())
	}

	invert() {
		const invertedEntries = entriesOf(this.sources).map(
			([path, disjoints]) =>
				[
					path,
					transform(disjoints, ([kind, disjoint]) => [
						kind,
						{ l: disjoint.r, r: disjoint.l }
					])
				] as DisjointSourceEntry
		)
		return new Disjoint(fromEntries(invertedEntries))
	}

	withPrefixKey(key: string) {
		const entriesWithPrefix = entriesOf(this.sources).map(
			([path, disjoints]): DisjointSourceEntry => {
				const segments = JSON.parse(path) as string[]
				segments.unshift(key)
				const pathWithPrefix = JSON.stringify(segments) as `[${string}]`
				return [pathWithPrefix, disjoints]
			}
		)
		return new Disjoint(fromEntries(entriesWithPrefix))
	}

	toString() {
		return stringify(this.sources)
	}
}
