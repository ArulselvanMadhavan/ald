import { IdealDoseModel } from './base.js'; // Assuming base.js is in the same directory
import { kb } from '../../constants.js'

class ZeroD extends IdealDoseModel {

    constructor(chem, { T, p }) { // Using object destructuring for T and p
        super(chem, p, T); // Note the order of p and T matches IdealDoseModel constructor
    }

    saturation_curve() {
        // Ensure chem and its properties are available and valid
        if (!this.chem || typeof this.chem.site_area === 'undefined' || 
            typeof this.vth === 'undefined' || typeof this.p === 'undefined' || 
            typeof this.T === 'undefined' || typeof this.chem.beta0 === 'undefined') {
            console.error("One or more required properties for saturation_curve are undefined.");
            return [[], []]; // Return empty arrays or handle error appropriately
        }

        const nu = 0.25 * this.chem.site_area * this.vth * this.p / (kb * this.T) * this.chem.beta0;
        
        if (nu === 0 || !isFinite(nu)) { // Avoid division by zero or NaN/Infinity issues
            console.warn("Calculated 'nu' is zero or not finite, saturation curve cannot be generated meaningfully.");
            return [[], []];
        }
        
        const t0 = 1 / nu;
        const dt = 0.01 * t0;
        const t_arr = [];
        const cov_arr = [];

        for (let t = 0; t <= 5 * t0; t += dt) {
            t_arr.push(t);
            cov_arr.push(1 - Math.exp(-t / t0));
        }
        
        return [t_arr, cov_arr];
    }
}

// Export the class if you intend to use it in other modules
export { ZeroD };