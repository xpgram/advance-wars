
type AttackInfo = {
    /** The name of the 'attack,' an empty string if null. */
    readonly name: string;
    /** An n-length list of armor-type target heuristics, where n is the number of armor types. */
    readonly targetMap: number[];
    /** An n-length list of base damage numbers, where n is the number of unit types. */
    readonly damageMap: number[];
}