import {
	CompiledFunction,
	entriesOf,
	hasDomain,
	includes,
	isArray,
	printable,
	throwParseError,
	transform,
	type Dict
} from "@arktype/util"
import {
	BaseNode,
	type BaseAttachments,
	type Node,
	type UnknownNode
} from "./base.js"
import { maybeGetBasisKind } from "./bases/basis.js"
import type {
	instantiateAliases,
	instantiateSchemaBranches,
	validateAliases,
	validateSchemaBranch
} from "./inference.js"
import type { keywords } from "./keywords/keywords.js"
import { SchemaNode, type Schema } from "./schema.js"
import type { BranchKind } from "./sets/union.js"
import {
	In,
	type CheckResult,
	type CompilationKind
} from "./shared/compilation.js"
import {
	defaultInnerKeySerializer,
	refinementKinds,
	type NodeKind,
	type SchemaKind,
	type SchemaParseContext,
	type SchemaParseOptions,
	type UnknownNodeImplementation
} from "./shared/define.js"
import {
	NodeImplementationByKind,
	type Definition,
	type NormalizedDefinition,
	type reducibleKindOf
} from "./shared/nodes.js"
import { isNode } from "./shared/registry.js"

export type nodeResolutions<keywords> = { [k in keyof keywords]: Schema }

export class Space<keywords extends nodeResolutions<keywords> = any> {
	declare infer: {
		[k in keyof keywords]: keywords[k]["infer"]
	}
	private declare static unknownUnion?: Schema<unknown, "union">
	declare static keywords: typeof keywords
	keywords = {} as keywords

	readonly schemas: readonly Schema[]
	readonly referencesById: Record<string, UnknownNode>
	readonly references: readonly UnknownNode[]
	allowsSource!: string
	readonly composeAllows: <
		alias extends keyof keywords | ((data: unknown) => boolean)
	>(
		alias: alias
	) => alias extends keyof keywords ? keywords[alias]["allows"] : alias
	traverseSource!: string
	readonly composeTraverse: <
		alias extends keyof keywords | ((data: unknown) => CheckResult<unknown>)
	>(
		alias: alias
	) => alias extends keyof keywords ? keywords[alias]["traverse"] : alias

	private constructor(aliases: Dict<string, unknown>) {
		const aliasEntries = Object.entries(aliases)
		const prenodes = aliasEntries.map(
			([k, v]) => this.parse(schemaKindOf(v), v, { alias: k }) as Schema
		)
		this.referencesById = prenodes.reduce(
			(result, child) => Object.assign(result, child.contributesReferencesById),
			{}
		)
		this.references = Object.values(this.referencesById)
		const bootstrapAllows = this.compile("allows")
		for (const reference of this.references) {
			reference.allows = bootstrapAllows(reference.alias as never)
		}
		// TODO: references, everything would have to somehow be updated here?
		this.schemas = prenodes.map((node) => this.reduce(node))
		this.keywords = transform(this.schemas, ([, v]) => [v.alias, v]) as never
		this.composeAllows = this.compile("allows")
		this.composeTraverse = this.compile("traverse")
		for (const reference of this.references) {
			reference.allows = this.composeAllows(reference.alias as never)
			reference.traverse = this.composeTraverse(reference.alias as never)
		}
		if (Space.root && !Space.unknownUnion) {
			// ensure root has been set before parsing this to avoid a circularity
			Space.unknownUnion = this.prereduced("union", [
				"string",
				"number",
				"object",
				"bigint",
				"symbol",
				{ unit: true },
				{ unit: false },
				{ unit: null },
				{ unit: undefined }
			])
		}
	}

	// TODO: cache
	compile<kind extends CompilationKind>(
		kind: kind
	): this[kind extends "allows" ? "composeAllows" : "composeTraverse"]
	compile(kind: CompilationKind): any {
		let $ource = `return {
			${this.references
				.map(
					(reference) => `${reference.alias}(${In}){
					${reference.compileBody({
						compilationKind: kind,
						path: [],
						discriminants: []
					})}
			}`
				)
				.join(",\n")}`
		if (kind === "allows") {
			$ource += "}"
			this.allowsSource = $ource
			const $ = new CompiledFunction<() => any>($ource)
			return ((alias) => {
				if (typeof alias === "function") {
					return alias.bind($())
				}
				return $()[alias]
			}) as this["composeAllows"]
		}
		for (const schema of this.schemas) {
			$ource += `,
	${schema.alias}Root(${In}) {
		const problems = []
		this.${schema.alias}(${In}, problems)
		if(problems.length === 0) {
			return { data: ${In} }
		}
		return { problems }
	}`
		}
		$ource += "}"
		this.traverseSource = $ource
		const $ = new CompiledFunction<() => any>($ource)
		return ((alias) => {
			if (typeof alias === "function") {
				return alias.bind($())
			}
			return $()[alias]
		}) as this["composeTraverse"]
	}

	get builtin() {
		return Space.keywords
	}

	static from = <const aliases>(aliases: validateAliases<aliases>) =>
		new Space<instantiateAliases<aliases>>(aliases as never)

	static root = new Space<{}>({})

	union<const branches extends readonly Definition<BranchKind>[]>(
		input: {
			branches: {
				[i in keyof branches]: validateSchemaBranch<branches[i], keywords>
			}
		} & NormalizedDefinition<"union">
	): instantiateSchemaBranches<branches> {
		return this.node("union", input) as never
	}

	branches<const branches extends readonly Definition<BranchKind>[]>(
		...branches: {
			[i in keyof branches]: validateSchemaBranch<branches[i], keywords>
		}
	): instantiateSchemaBranches<branches> {
		return this.node("union", branches as never) as never
	}

	units<const branches extends readonly unknown[]>(
		...values: branches
	): branches["length"] extends 1
		? Schema<branches[0], "unit">
		: Schema<branches[number], "union" | "unit"> {
		const uniqueValues: unknown[] = []
		for (const value of values) {
			if (!uniqueValues.includes(value)) {
				uniqueValues.push(value)
			}
		}
		const branches = uniqueValues.map((unit) =>
			this.prereduced("unit", { unit })
		)
		if (branches.length === 1) {
			return branches[0]
		}
		return this.prereduced("union", {
			branches
		}) as never
	}

	prereduced<kind extends SchemaKind>(
		kind: kind,
		input: Definition<kind>
	): Node<kind> {
		return this.node(kind, input, {
			prereduced: true
		}) as never
	}

	schemaFromKinds<defKind extends SchemaKind>(
		allowedKinds: readonly defKind[],
		input: unknown
	): Node<reducibleKindOf<defKind>> {
		const kind = schemaKindOf(input)
		if (!allowedKinds.includes(kind as never)) {
			return throwParseError(
				`Schema of kind ${kind} should be one of ${allowedKinds}`
			)
		}
		return this.node(kind, input as never, {}) as never
	}

	static parseCache: Record<string, Node> = {}

	node<defKind extends NodeKind>(
		kind: defKind,
		def: Definition<defKind>,
		opts: SchemaParseOptions = {}
	): Node<reducibleKindOf<defKind>> {
		const node = this.parse(kind, def, opts)
		if (this.composeAllows === undefined) {
			return node as never
		}
		node.allows = this.composeAllows(
			new CompiledFunction(
				In,
				node.compileBody({
					path: [],
					discriminants: [],
					compilationKind: "allows"
				})
			)
		)
		if (!node.isSchema() || opts.prereduced) {
			node.traverse = (data) => ({
				data
			})
			return node as never
		}
		const reduced = this.reduce(node)
		reduced.traverse = (data) => ({
			data
		})
		return reduced as never
	}

	private parse(
		kind: NodeKind,
		def: unknown,
		opts: SchemaParseOptions
	): UnknownNode {
		if (isNode(def)) {
			return def as never
		}
		const implementation: UnknownNodeImplementation = NodeImplementationByKind[
			kind
		] as never
		const normalizedDefinition: any = implementation.normalize?.(def) ?? def
		const ctx: SchemaParseContext<any> = {
			...opts,
			normalizedDefinition,
			space: this,
			implementation
		}
		if (opts.alias) {
			normalizedDefinition.alias = opts.alias
		}
		const inner: Record<string, unknown> = {}
		ctx.implementation.addContext?.(ctx)
		const schemaEntries = entriesOf(normalizedDefinition).sort((l, r) =>
			l[0] < r[0] ? -1 : 1
		)
		let json: Record<string, unknown> = {}
		let typeJson: Record<string, unknown> = {}
		const children: UnknownNode[] = []
		for (const [k, v] of schemaEntries) {
			const keyDefinition = ctx.implementation.keys[k]
			if (!(k in ctx.implementation.keys)) {
				return throwParseError(`Key ${k} is not valid on ${kind} schema`)
			}
			const innerValue = keyDefinition.parse ? keyDefinition.parse(v, ctx) : v
			if (innerValue === undefined && !keyDefinition.preserveUndefined) {
				continue
			}
			inner[k] = innerValue
			if (keyDefinition.child) {
				if (Array.isArray(innerValue)) {
					json[k] = innerValue.map((node) => node.collapsibleJson)
					children.push(...innerValue)
				} else {
					json[k] = innerValue.collapsibleJson
					children.push(innerValue)
				}
			} else {
				json[k] = keyDefinition.serialize
					? keyDefinition.serialize(v)
					: defaultInnerKeySerializer(v)
			}
			if (!keyDefinition.meta) {
				typeJson[k] = json[k]
			}
		}
		const innerEntries = entriesOf(inner)
		let collapsibleJson = json
		if (
			innerEntries.length === 1 &&
			innerEntries[0][0] === ctx.implementation.collapseKey
		) {
			collapsibleJson = json[ctx.implementation.collapseKey] as never
			if (hasDomain(collapsibleJson, "object")) {
				json = collapsibleJson
				typeJson = collapsibleJson
			}
		}
		const id = JSON.stringify({ kind, ...json })
		if (id in Space.parseCache) {
			return Space.parseCache[id] as never
		}
		const typeId = JSON.stringify({ kind, ...typeJson })
		const attachments = {
			kind,
			inner,
			entries: innerEntries,
			json,
			typeJson,
			collapsibleJson,
			children,
			id,
			typeId,
			space: this
		} satisfies Record<keyof BaseAttachments<any>, unknown> as never
		return includes(refinementKinds, kind)
			? new (BaseNode as any)(attachments)
			: new (SchemaNode as any)(attachments)
	}

	private reduce(node: Schema): Schema {
		if (Space.unknownUnion?.typeId === node.typeId) {
			return Space.keywords.unknown
		}
		if (node.implementation.reduce) {
			const reduced = node.implementation.reduce(node.inner, this)
			if (reduced) {
				return reduced as Schema
			}
		}
		return node
	}

	readonly schema = Object.assign(this.branches.bind(this), {
		units: this.units.bind(this),
		union: this.union.bind(this),
		prereduced: this.prereduced.bind(this)
	})
}

export const space = Space.from

export const rootSchema = Space.root.schema.bind(Space.root)

export const rootNode = Space.root.node.bind(Space.root)

const schemaKindOf = (input: unknown): SchemaKind => {
	const basisKind = maybeGetBasisKind(input)
	if (basisKind) {
		return basisKind
	}
	if (typeof input === "object" && input !== null) {
		if (isNode(input)) {
			if (input.isSchema()) {
				return input.kind
			}
			// otherwise, error at end of function
		} else if ("morph" in input) {
			return "morph"
		} else if ("branches" in input || isArray(input)) {
			return "union"
		} else {
			return "intersection"
		}
	}
	return throwParseError(`${printable(input)} is not a valid type schema`)
}
