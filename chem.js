import { calc_vth } from './aldutils.js'; // Assuming aldutils.js is in the same directory
import { kb, Rgas, Nav } from './constants.js'; // Assuming constants.js is in the same directory

const _precursor_mass = {
    'TMA': 144.17,
    'H2O': 18.01
};

export class Precursor {
    /**
     * Defines a precursor molecule
     */
    constructor(name = 'None', mass = null, ligands = null) {
        this.name = name;
        if (mass === null) {
            this.mass = _precursor_mass[this.name];
        } else {
            this.mass = mass;
        }
        this.ligands = ligands;
    }

    /**
     * Calculate the mean thermal velocity at temperature T (in K)
     * @param {number} T - Temperature in K
     * @returns {number}
     */
    vth(T) {
        return calc_vth(this.mass, T);
    }

    /**
     * Calculate the flux per unit area for a given temperature (in K) and pressure (in Pa)
     * @param {number} T - Temperature in K
     * @param {number} p - Pressure in Pa
     * @param {boolean} [in_mols=false] - If true, calculate flux in mols/(m^2*s)
     * @returns {number}
     */
    Jwall(T, p, in_mols = false) {
        if (in_mols) {
            if (Rgas * T === 0) return NaN; // Avoid division by zero
            return 0.25 * this.vth(T) * p / (Rgas * T);
        } else {
            if (kb * T === 0) return NaN; // Avoid division by zero
            return 0.25 * this.vth(T) * p / (kb * T);
        }
    }
}

export class SurfaceKinetics {
    /**
     * Base class for self-limited kinetics
     * It assumes that a fraction of the surface is reactive and comprised of reaction
     * sites of equal surface area. The default is that all the surface is reactive.
     */
    constructor(prec, nsites, f = 1) {
        this.prec = prec;
        this._f = f;
        // Initialize _s0 before setting nsites to avoid issues in the setter
        if (nsites !== 0 && f !== 0) {
            this._s0 = f / nsites;
        } else {
            this._s0 = 0; // Or handle as an error/default
        }
        this.nsites = nsites; // This will use the setter
    }

    /** Area of a single reaction site */
    get site_area() {
        return this._s0;
    }

    set site_area(value) {
        this._s0 = value;
        if (this._s0 !== 0) {
            this._nsites = this._f / this._s0;
        } else {
            this._nsites = 0; // Or handle as an error/default
        }
    }

    /** Number of reactive sites per surface area */
    get nsites() {
        return this._nsites;
    }

    set nsites(value) {
        this._nsites = value;
        if (this._nsites !== 0) {
            this._s0 = this._f / this._nsites;
        } else {
            this._s0 = 0; // Or handle as an error/default
        }
    }

    /** Number of reactive sites per surface area in mols */
    get nsites_mol() {
        if (Nav === 0) return NaN; // Avoid division by zero
        return this.nsites / Nav;
    }

    /** Fraction of reactive sites */
    get f() {
        return this._f; // Corrected: Python had self._f without return
    }

    set f(value) {
        this._f = value;
        if (this._s0 !== 0) { // Ensure _s0 is not zero to avoid division by zero
            this._nsites = this._f / this._s0;
        } else if (this._nsites !== 0) { // Recalculate _s0 if _nsites is known
             this._s0 = this._f / this._nsites;
        } else {
            // Handle case where both _s0 and _nsites are zero or undefined
            // Potentially set _nsites to 0 or based on a default _s0
        }
    }

    beta(/* ...args */) { // JSDoc for args if known
        // Base class method, intended to be overridden
    }

    beta_av(/* ...args */) { // JSDoc for args if known
        // Base class method, intended to be overridden
    }

    vth(T) {
        return this.prec.vth(T);
    }

    Jwall(T, p) {
        return this.prec.Jwall(T, p);
    }
}

export class ALDideal extends SurfaceKinetics {
    /** Ideal first-order irreversible Langmuir kinetics */
    static name = 'ideal'; // Static property

    constructor(prec, nsites, beta0, f = 1, dm = 1) {
        super(prec, nsites, f);
        this.beta0 = beta0;
        this.dm = dm;
    }

    beta(cov = 0) {
        return this.f * this.beta0 * (1 - cov);
    }

    beta_av(av) {
        return this.f * this.beta0 * av;
    }

    /** Characteristic time for saturation */
    t0(T, p) {
        const denominator = this.site_area * this.Jwall(T, p) * this.beta0;
        if (denominator === 0) return Infinity; // Or handle as an error
        return 1.0 / denominator;
    }

    /** Return the saturation curve as a [time_array, coverage_array] tuple */
    saturation_curve(T, p) {
        const t0_val = this.t0(T, p);
        if (!isFinite(t0_val)) return [[], []]; // Handle cases where t0 is Infinity

        const tmax = 5 * t0_val; // Simplified tmax calculation
        const dt = tmax / 100; // Generate 100 points
        const time_array = [];
        const coverage_array = [];

        if (dt === 0) return [[0], [0]]; // Avoid infinite loop if tmax is 0

        for (let t = 0; t <= tmax; t += dt) {
            time_array.push(t);
            coverage_array.push(1 - Math.exp(-t / t0_val));
        }
        // Ensure the last point is included if tmax is not perfectly divisible by dt
        if (time_array[time_array.length - 1] < tmax && tmax > 0) {
             time_array.push(tmax);
             coverage_array.push(1 - Math.exp(-tmax / t0_val));
        }

        return [time_array, coverage_array];
    }
}