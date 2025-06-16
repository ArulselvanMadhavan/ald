import { amu, kb, Nav } from './constants.js'; // Adjust path as necessary

/**
 * Compute the mean thermal velocity
 * @param {number} M - Molecular mass in atomic mass units
 * @param {number} T - Temperature in K
 * @returns {number} Mean thermal velocity
 */
export function calc_vth(M, T) {
    if (M <= 0 || T < 0) {
        console.warn("Molecular mass must be positive and temperature must be non-negative for calc_vth.");
        return NaN; // Or throw an error
    }
    return Math.sqrt(8 * kb * T / (Math.PI * amu * M));
}

/**
 * Average area of a surface site from growth per cycle
 * @param {number} gpc - Growth per cycle, in Angstroms
 * @param {number} M - Molecular mass from the solid in atomic mass units
 * @param {number} density - Density of the film, in g/cm3
 * @param {number} [nmol=1] - Number of precursor molecules per unit formula of the solid
 * @returns {number} Average area of a surface site in sq. meters
 */
export function calc_sitearea_fromgpc(gpc, M, density, nmol = 1) {
    if (gpc < 0 || M <= 0 || density <= 0 || nmol <= 0) {
        console.warn("Invalid input parameters for calc_sitearea_fromgpc. Values must be positive (gpc can be 0).");
        return NaN;
    }
    const masscm2 = density * gpc * 1e-8;
    if (M === 0) return NaN; // Avoid division by zero
    const molcm2 = masscm2 / M * Nav; // Corrected: Nav was 6.022e23 in python
    if (nmol === 0 || molcm2 === 0) return NaN; // Avoid division by zero
    return 1e-4 / (nmol * molcm2);
}

/**
 * Average area of a surface site from QCM mass
 * @param {number} mpc - Mass per cycle in ng/cm2
 * @param {number} M - Molecular mass in atomic mass units
 * @param {number} [nmol=1] - Number of precursor molecules per unit formula of the solid
 * @returns {number} Average area of a surface site in sq. meters
 */
export function calc_sitearea_fromqcm(mpc, M, nmol = 1) {
    if (mpc < 0 || M <= 0 || nmol <= 0) {
        console.warn("Invalid input parameters for calc_sitearea_fromqcm. Values must be positive (mpc can be 0).");
        return NaN;
    }
    const denominator = mpc * 1e-5 * Nav * nmol; // Corrected: Nav was 6.022e23 in python
    if (denominator === 0) return NaN; // Avoid division by zero
    return M / denominator;
}

/**
 * Average area of a surface site from RBS data
 * @param {number} atoms_area - Atoms per unit area for one ALD cycle (atoms per sq. meter)
 * @param {number} [atoms_permol=1.0] - Number of atoms per precursor molecule
 * @returns {number} Average area of a surface site in sq. meters
 */
export function calc_sitearea_fromrbs(atoms_area, atoms_permol = 1.0) {
    if (atoms_area <= 0 || atoms_permol <= 0) {
        console.warn("Invalid input parameters for calc_sitearea_fromrbs. Values must be positive.");
        return NaN;
    }
    if (atoms_area === 0) return NaN; // Avoid division by zero
    return atoms_permol / atoms_area;
}