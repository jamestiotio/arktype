import type { ConstraintRule } from "./constraint.js"
import { ConstraintNode, ConstraintSet } from "./constraint.js"

export interface DivisibilityRule extends ConstraintRule {
	readonly divisor: number
}

export class DivisibilityNode extends ConstraintNode<
	DivisibilityRule,
	typeof DivisibilityNode
> {
	static writeDefaultDescription(def: DivisibilityRule) {
		return def.divisor === 1 ? "an integer" : `a multiple of ${def.divisor}`
	}

	intersectOwnKeys(other: DivisibilityNode) {
		return {
			divisor: Math.abs(
				(this.divisor * other.divisor) /
					greatestCommonDivisor(this.divisor, other.divisor)
			)
		}
	}
}

export const DivisibilitySet = ConstraintSet<readonly [DivisibilityNode]>

export type DivisibilitySet = typeof DivisibilitySet

// https://en.wikipedia.org/wiki/Euclidean_algorithm
const greatestCommonDivisor = (l: number, r: number) => {
	let previous: number
	let greatestCommonDivisor = l
	let current = r
	while (current !== 0) {
		previous = current
		current = greatestCommonDivisor % current
		greatestCommonDivisor = previous
	}
	return greatestCommonDivisor
}
