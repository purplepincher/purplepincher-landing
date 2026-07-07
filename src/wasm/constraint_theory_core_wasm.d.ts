/* tslint:disable */
/* eslint-disable */

/**
 * 2D KD-tree for fast O(log N) nearest-neighbour queries.
 */
export class KDTree {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Build a KD-tree from a flat `Float32Array` of interleaved
     * `[x, y, x, y, …]` values.
     */
    static build(data: Float32Array): KDTree;
    /**
     * True when the tree contains no points.
     */
    is_empty(): boolean;
    /**
     * Returns the nearest point as
     * `{ point: Float32Array[2], index: number, distanceSq: number }`,
     * or `null` when the tree is empty.
     */
    nearest(x: number, y: number): any;
    /**
     * Returns up to `k` nearest neighbours as an array of:
     * `{ point: Float32Array[2], index: number, distanceSq: number }`.
     */
    nearest_k(x: number, y: number, k: number): any;
    /**
     * Number of points indexed by the tree.
     */
    size(): number;
}

/**
 * Pre-computes all valid Pythagorean triples up to a given density and
 * provides O(log N) snapping via internal KD-tree lookup.
 */
export class PythagoreanManifold {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Worst-case angular deviation (radians) for this manifold density.
     */
    max_angular_error(): number;
    /**
     * Build a new manifold. `density` controls the number of generated
     * states (typically 50–500). Higher density = finer resolution.
     */
    constructor(density: number);
    /**
     * Suggested noise threshold for a given use-case string:
     * "animation" (0.02), "game" (0.05), "robotics" (0.01),
     * "ml" (0.03), "consensus" (0.1).
     */
    static recommended_noise_threshold(use_case: string): number;
    /**
     * Snap a 2D vector to the nearest Pythagorean triple.
     *
     * Returns `{ snapped: Float32Array[2], noise: f32 }`.
     *
     * `noise` = 1 − resonance (dot product with nearest).
     * Noise near zero means an almost-exact match.
     */
    snap(x: number, y: number): any;
    /**
     * Like `snap()` but returns an error result for invalid inputs (NaN,
     * Infinity, zero vector).
     *
     * On success: `{ snapped: Float32Array[2], noise: f32 }`
     * On failure: `{ error: string }`
     */
    snap_checked(x: number, y: number): any;
    /**
     * Number of valid states stored in the manifold.
     */
    state_count(): number;
    /**
     * Validate a 2D vector before snapping (consensus-critical use).
     * Returns `null` on success, or a string describing the issue.
     */
    validate_input(x: number, y: number): string | undefined;
}

/**
 * A Pythagorean triple (a, b, c) where a² + b² = c².
 */
export class PythagoreanTriple {
    free(): void;
    [Symbol.dispose](): void;
    a(): number;
    b(): number;
    c(): number;
    /**
     * Returns true when a² + b² ≈ c² (within 1e-6).
     */
    is_valid(): boolean;
    /**
     * Create a new Pythagorean triple.
     */
    constructor(a: number, b: number, c: number);
    /**
     * Returns the normalized 2D vector [a/c, b/c].
     */
    to_vector(): Float32Array;
}

/**
 * Ricci flow evolution state machine.
 */
export class RicciFlow {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Evolve an array of curvature values in-place for the given number
     * of steps.  Mutates the input Float32Array.
     */
    evolve(curvatures: Float32Array, steps: number): void;
    /**
     * Create a new Ricci flow with the given `alpha` (learning rate,
     * 0.0–1.0) and `targetCurvature`.
     */
    constructor(alpha: number, target_curvature: number);
    /**
     * Convenience constructor with alpha=0.1, targetCurvature=0.0.
     */
    static with_defaults(): RicciFlow;
}

/**
 * Hidden dimensions required for target precision.
 * Returns k = ⌈log₂(1/ε)⌉.
 */
export function hidden_dimensions(epsilon: number): number;

/**
 * Maximum angular error (radians) for a given number of valid states.
 */
export function max_angular_error_for_states(state_count: number): number;

/**
 * Single step of Ricci flow: returns `curvature + alpha * (target - curvature)`.
 */
export function ricci_flow_step(curvature: number, alpha: number, target: number): number;

/**
 * Free-standing snap convenience: returns
 * `{ snapped: Float32Array[2], noise: f32 }`.
 */
export function snap(manifold: PythagoreanManifold, x: number, y: number): any;

/**
 * Library version string (e.g. "2.2.0").
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_kdtree_free: (a: number, b: number) => void;
    readonly __wbg_pythagoreanmanifold_free: (a: number, b: number) => void;
    readonly __wbg_pythagoreantriple_free: (a: number, b: number) => void;
    readonly __wbg_ricciflow_free: (a: number, b: number) => void;
    readonly hidden_dimensions: (a: number) => number;
    readonly kdtree_build: (a: number, b: number) => number;
    readonly kdtree_is_empty: (a: number) => number;
    readonly kdtree_nearest: (a: number, b: number, c: number) => any;
    readonly kdtree_nearest_k: (a: number, b: number, c: number, d: number) => any;
    readonly kdtree_size: (a: number) => number;
    readonly max_angular_error_for_states: (a: number) => number;
    readonly pythagoreanmanifold_max_angular_error: (a: number) => number;
    readonly pythagoreanmanifold_new: (a: number) => number;
    readonly pythagoreanmanifold_recommended_noise_threshold: (a: number, b: number) => number;
    readonly pythagoreanmanifold_snap: (a: number, b: number, c: number) => any;
    readonly pythagoreanmanifold_snap_checked: (a: number, b: number, c: number) => any;
    readonly pythagoreanmanifold_state_count: (a: number) => number;
    readonly pythagoreanmanifold_validate_input: (a: number, b: number, c: number) => [number, number];
    readonly pythagoreantriple_a: (a: number) => number;
    readonly pythagoreantriple_b: (a: number) => number;
    readonly pythagoreantriple_c: (a: number) => number;
    readonly pythagoreantriple_is_valid: (a: number) => number;
    readonly pythagoreantriple_new: (a: number, b: number, c: number) => number;
    readonly pythagoreantriple_to_vector: (a: number) => any;
    readonly ricci_flow_step: (a: number, b: number, c: number) => number;
    readonly ricciflow_evolve: (a: number, b: number, c: number, d: any, e: number) => void;
    readonly ricciflow_with_defaults: () => number;
    readonly snap: (a: number, b: number, c: number) => any;
    readonly version: () => [number, number];
    readonly ricciflow_new: (a: number, b: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
