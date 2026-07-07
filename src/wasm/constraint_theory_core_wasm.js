/* @ts-self-types="./constraint_theory_core_wasm.d.ts" */

/**
 * 2D KD-tree for fast O(log N) nearest-neighbour queries.
 */
export class KDTree {
    static __wrap(ptr) {
        const obj = Object.create(KDTree.prototype);
        obj.__wbg_ptr = ptr;
        KDTreeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KDTreeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_kdtree_free(ptr, 0);
    }
    /**
     * Build a KD-tree from a flat `Float32Array` of interleaved
     * `[x, y, x, y, …]` values.
     * @param {Float32Array} data
     * @returns {KDTree}
     */
    static build(data) {
        const ptr0 = passArrayF32ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.kdtree_build(ptr0, len0);
        return KDTree.__wrap(ret);
    }
    /**
     * True when the tree contains no points.
     * @returns {boolean}
     */
    is_empty() {
        const ret = wasm.kdtree_is_empty(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the nearest point as
     * `{ point: Float32Array[2], index: number, distanceSq: number }`,
     * or `null` when the tree is empty.
     * @param {number} x
     * @param {number} y
     * @returns {any}
     */
    nearest(x, y) {
        const ret = wasm.kdtree_nearest(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Returns up to `k` nearest neighbours as an array of:
     * `{ point: Float32Array[2], index: number, distanceSq: number }`.
     * @param {number} x
     * @param {number} y
     * @param {number} k
     * @returns {any}
     */
    nearest_k(x, y, k) {
        const ret = wasm.kdtree_nearest_k(this.__wbg_ptr, x, y, k);
        return ret;
    }
    /**
     * Number of points indexed by the tree.
     * @returns {number}
     */
    size() {
        const ret = wasm.kdtree_size(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) KDTree.prototype[Symbol.dispose] = KDTree.prototype.free;

/**
 * Pre-computes all valid Pythagorean triples up to a given density and
 * provides O(log N) snapping via internal KD-tree lookup.
 */
export class PythagoreanManifold {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PythagoreanManifoldFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pythagoreanmanifold_free(ptr, 0);
    }
    /**
     * Worst-case angular deviation (radians) for this manifold density.
     * @returns {number}
     */
    max_angular_error() {
        const ret = wasm.pythagoreanmanifold_max_angular_error(this.__wbg_ptr);
        return ret;
    }
    /**
     * Build a new manifold. `density` controls the number of generated
     * states (typically 50–500). Higher density = finer resolution.
     * @param {number} density
     */
    constructor(density) {
        const ret = wasm.pythagoreanmanifold_new(density);
        this.__wbg_ptr = ret;
        PythagoreanManifoldFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Suggested noise threshold for a given use-case string:
     * "animation" (0.02), "game" (0.05), "robotics" (0.01),
     * "ml" (0.03), "consensus" (0.1).
     * @param {string} use_case
     * @returns {number}
     */
    static recommended_noise_threshold(use_case) {
        const ptr0 = passStringToWasm0(use_case, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pythagoreanmanifold_recommended_noise_threshold(ptr0, len0);
        return ret;
    }
    /**
     * Snap a 2D vector to the nearest Pythagorean triple.
     *
     * Returns `{ snapped: Float32Array[2], noise: f32 }`.
     *
     * `noise` = 1 − resonance (dot product with nearest).
     * Noise near zero means an almost-exact match.
     * @param {number} x
     * @param {number} y
     * @returns {any}
     */
    snap(x, y) {
        const ret = wasm.pythagoreanmanifold_snap(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Like `snap()` but returns an error result for invalid inputs (NaN,
     * Infinity, zero vector).
     *
     * On success: `{ snapped: Float32Array[2], noise: f32 }`
     * On failure: `{ error: string }`
     * @param {number} x
     * @param {number} y
     * @returns {any}
     */
    snap_checked(x, y) {
        const ret = wasm.pythagoreanmanifold_snap_checked(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Number of valid states stored in the manifold.
     * @returns {number}
     */
    state_count() {
        const ret = wasm.pythagoreanmanifold_state_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Validate a 2D vector before snapping (consensus-critical use).
     * Returns `null` on success, or a string describing the issue.
     * @param {number} x
     * @param {number} y
     * @returns {string | undefined}
     */
    validate_input(x, y) {
        const ret = wasm.pythagoreanmanifold_validate_input(this.__wbg_ptr, x, y);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
}
if (Symbol.dispose) PythagoreanManifold.prototype[Symbol.dispose] = PythagoreanManifold.prototype.free;

/**
 * A Pythagorean triple (a, b, c) where a² + b² = c².
 */
export class PythagoreanTriple {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PythagoreanTripleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pythagoreantriple_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    a() {
        const ret = wasm.pythagoreantriple_a(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    b() {
        const ret = wasm.pythagoreantriple_b(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    c() {
        const ret = wasm.pythagoreantriple_c(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns true when a² + b² ≈ c² (within 1e-6).
     * @returns {boolean}
     */
    is_valid() {
        const ret = wasm.pythagoreantriple_is_valid(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Create a new Pythagorean triple.
     * @param {number} a
     * @param {number} b
     * @param {number} c
     */
    constructor(a, b, c) {
        const ret = wasm.pythagoreantriple_new(a, b, c);
        this.__wbg_ptr = ret;
        PythagoreanTripleFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the normalized 2D vector [a/c, b/c].
     * @returns {Float32Array}
     */
    to_vector() {
        const ret = wasm.pythagoreantriple_to_vector(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) PythagoreanTriple.prototype[Symbol.dispose] = PythagoreanTriple.prototype.free;

/**
 * Ricci flow evolution state machine.
 */
export class RicciFlow {
    static __wrap(ptr) {
        const obj = Object.create(RicciFlow.prototype);
        obj.__wbg_ptr = ptr;
        RicciFlowFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RicciFlowFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_ricciflow_free(ptr, 0);
    }
    /**
     * Evolve an array of curvature values in-place for the given number
     * of steps.  Mutates the input Float32Array.
     * @param {Float32Array} curvatures
     * @param {number} steps
     */
    evolve(curvatures, steps) {
        var ptr0 = passArrayF32ToWasm0(curvatures, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.ricciflow_evolve(this.__wbg_ptr, ptr0, len0, curvatures, steps);
    }
    /**
     * Create a new Ricci flow with the given `alpha` (learning rate,
     * 0.0–1.0) and `targetCurvature`.
     * @param {number} alpha
     * @param {number} target_curvature
     */
    constructor(alpha, target_curvature) {
        const ret = wasm.ricciflow_new(alpha, target_curvature);
        this.__wbg_ptr = ret;
        RicciFlowFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Convenience constructor with alpha=0.1, targetCurvature=0.0.
     * @returns {RicciFlow}
     */
    static with_defaults() {
        const ret = wasm.ricciflow_with_defaults();
        return RicciFlow.__wrap(ret);
    }
}
if (Symbol.dispose) RicciFlow.prototype[Symbol.dispose] = RicciFlow.prototype.free;

/**
 * Hidden dimensions required for target precision.
 * Returns k = ⌈log₂(1/ε)⌉.
 * @param {number} epsilon
 * @returns {number}
 */
export function hidden_dimensions(epsilon) {
    const ret = wasm.hidden_dimensions(epsilon);
    return ret >>> 0;
}

/**
 * Maximum angular error (radians) for a given number of valid states.
 * @param {number} state_count
 * @returns {number}
 */
export function max_angular_error_for_states(state_count) {
    const ret = wasm.max_angular_error_for_states(state_count);
    return ret;
}

/**
 * Single step of Ricci flow: returns `curvature + alpha * (target - curvature)`.
 * @param {number} curvature
 * @param {number} alpha
 * @param {number} target
 * @returns {number}
 */
export function ricci_flow_step(curvature, alpha, target) {
    const ret = wasm.ricci_flow_step(curvature, alpha, target);
    return ret;
}

/**
 * Free-standing snap convenience: returns
 * `{ snapped: Float32Array[2], noise: f32 }`.
 * @param {PythagoreanManifold} manifold
 * @param {number} x
 * @param {number} y
 * @returns {any}
 */
export function snap(manifold, x, y) {
    _assertClass(manifold, PythagoreanManifold);
    const ret = wasm.snap(manifold.__wbg_ptr, x, y);
    return ret;
}

/**
 * Library version string (e.g. "2.2.0").
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_7a3f7b938f93cf12: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbg___wbindgen_throw_1506f2235d1bdba0: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_new_ce1ab61c1c2b300d: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_d90091b82fdf5b91: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_with_length_7d20818cf1afe359: function(arg0) {
            const ret = new Float32Array(arg0 >>> 0);
            return ret;
        },
        __wbg_push_a6822215aa43e71c: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_set_6e30c9374c26414c: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_index_2ae12f863484ce58: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./constraint_theory_core_wasm_bg.js": import0,
    };
}

const KDTreeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_kdtree_free(ptr, 1));
const PythagoreanManifoldFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pythagoreanmanifold_free(ptr, 1));
const PythagoreanTripleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pythagoreantriple_free(ptr, 1));
const RicciFlowFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_ricciflow_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('constraint_theory_core_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
