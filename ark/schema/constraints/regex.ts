import { throwParseError } from "@arktype/util"
import { ConstraintNode } from "./constraint.js"

export class RegexConstraint extends ConstraintNode<{ rule: RegExp }> {
	readonly kind = "regex"

	hash() {
		return ""
	}

	get literal() {
		return serializeRegex(this.rule)
	}

	writeDefaultDescription() {
		return `matched by ${this.literal}`
	}

	// For now, non-equal regex are naively intersected
	reduceWith() {
		return null
	}
}

// converting a regex to a string alphabetizes the flags for us
export const serializeRegex = (regex: RegExp) => `${regex}` as RegexLiteral

export type RegexLiteral = `/${string}/${string}`

const regexLiteralMatcher = /^\/(.+)\/([a-z]*)$/

// export const patternConstraint = (input: PatternInput): PatternDefinition =>
// 	typeof input === "string" ? parseRegexLiteral(input) : input

export const parseRegexLiteral = (literal: string) => {
	const match = regexLiteralMatcher.exec(literal)
	if (!match || !match[1]) {
		return throwParseError(
			`'${literal}' is not a valid RegexLiteral (should be /source/flags)`
		)
	}
	return {
		source: match[1],
		flags: match[2]
	}
}
