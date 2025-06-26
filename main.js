import { Precursor, ALDideal } from './chem.js'; // Import Precursor and ALDideal from chem.js
import { ZeroD } from './models/dose/ZeroD.js'; // Import ZeroD

// Assuming poisson function is needed here, otherwise remove it
function poisson(lambda) {
    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;

    do {
        k++;
        p *= Math.random();
    } while (p > L);

    return k - 1;
}

/**
 * Transforms a two-element array of arrays into an array of objects.
 * Each object will have keys "0" and "1" corresponding to elements
 * from the input arrays.
 * @param {Array<Array<any>>} inputArray - A two-element array, where each element is an array of equal size.
 * @returns {Array<Object>} An array of objects.
 */
function zipArraysToObjects(inputArray) {
    if (!inputArray || inputArray.length !== 2 || !Array.isArray(inputArray[0]) || !Array.isArray(inputArray[1]) || inputArray[0].length !== inputArray[1].length) {
        console.error("Invalid input for zipArraysToObjects: Expected a two-element array of arrays of equal length.");
        return [];
    }
    const arr1 = inputArray[0];
    const arr2 = inputArray[1];
    const result = [];
    for (let i = 0; i < arr1.length; i++) {
        result.push({ "0": arr1[i], "1": arr2[i] });
    }
    return result;
}
document.addEventListener('DOMContentLoaded', function() {

    // Global variables to store precursor and ZeroD instances
    let tmaPrecursor = null;
    let h2oPrecursor = null;
    let tmaZeroD = null;
    let h2oZeroD = null;

    // Function to create precursor instances
    function createPrecursorInstances() {
        const molarMassInput = document.getElementById('molar-mass');
        const molarMass = molarMassInput ? parseFloat(molarMassInput.value) : 144.17;
        
        // Create TMA precursor instance
        tmaPrecursor = new Precursor('TMA', molarMass, null);
        console.log("TMA Precursor Initialized:", tmaPrecursor);
        
        // Create H2O precursor instance
        h2oPrecursor = new Precursor('H2O', molarMass, null);
        console.log("H2O Precursor Initialized:", h2oPrecursor);
    }

    // Function to create ZeroD instances
    function createZeroDInstances() {
        const temperatureInput = document.getElementById('temperature');
        const pressureInput = document.getElementById('pressure');
        
        const temperature = temperatureInput ? parseFloat(temperatureInput.value) : 500;
        const pressure = pressureInput ? parseFloat(pressureInput.value) : 13.157894736842104;
        
        // Define variables for ALDideal arguments
        const nsitesValue = 1e19;
        const beta0Value = 1e-3;
        const fValue = 1;
        const dmValue = 1.0;
        
        // Create ALDideal instances for each precursor
        const tmaAldIdeal = new ALDideal(tmaPrecursor, nsitesValue, beta0Value, fValue, dmValue);
        const h2oAldIdeal = new ALDideal(h2oPrecursor, nsitesValue, beta0Value, fValue, dmValue);
        
        // Create ZeroD instances
        tmaZeroD = new ZeroD(tmaAldIdeal, { T: temperature, p: pressure });
        h2oZeroD = new ZeroD(h2oAldIdeal, { T: temperature, p: pressure });
        
        console.log("TMA ZeroD Model Initialized:", tmaZeroD);
        console.log("H2O ZeroD Model Initialized:", h2oZeroD);
    }

    // Function to update ZeroD instances with new parameters
    function updateZeroDInstances() {
        const temperatureInput = document.getElementById('temperature');
        const pressureInput = document.getElementById('pressure');
        
        const temperature = temperatureInput ? parseFloat(temperatureInput.value) : 500;
        const pressure = pressureInput ? parseFloat(pressureInput.value) : 13.157894736842104;
        
        // Define variables for ALDideal arguments
        const nsitesValue = 1e19;
        const beta0Value = 1e-3;
        const fValue = 1;
        const dmValue = 1.0;
        
        // Create ALDideal instances for each precursor
        const tmaAldIdeal = new ALDideal(tmaPrecursor, nsitesValue, beta0Value, fValue, dmValue);
        const h2oAldIdeal = new ALDideal(h2oPrecursor, nsitesValue, beta0Value, fValue, dmValue);
        
        // Update ZeroD instances
        tmaZeroD = new ZeroD(tmaAldIdeal, { T: temperature, p: pressure });
        h2oZeroD = new ZeroD(h2oAldIdeal, { T: temperature, p: pressure });
        
        console.log("ZeroD instances updated with T:", temperature, "p:", pressure);
    }

    // Initialize precursor and ZeroD instances
    createPrecursorInstances();
    createZeroDInstances();

    // Tab switching logic
    const tabElements = document.querySelectorAll('button[role="tab"]');

    // Event listener for "Plot Saturation curve" button
    const plotButton = document.getElementById('plot-saturation-button');
    if (plotButton) {
        plotButton.addEventListener('click', function() {
            // Get the selected precursor
            const precursorSelect = document.getElementById('precursor-select');
            const selectedPrecursor = precursorSelect ? precursorSelect.value : 'TMA';
            
            // Choose the appropriate ZeroD instance based on selected precursor
            let selectedZeroD;
            if (selectedPrecursor === 'H2O') {
                selectedZeroD = h2oZeroD;
                console.log('Using H2O ZeroD instance for saturation curve');
            } else {
                selectedZeroD = tmaZeroD;
                console.log('Using TMA ZeroD instance for saturation curve');
            }
            
            // Update ZeroD instances with current parameters before plotting
            updateZeroDInstances();
            
            // Get the updated instance based on selection
            if (selectedPrecursor === 'H2O') {
                selectedZeroD = h2oZeroD;
            } else {
                selectedZeroD = tmaZeroD;
            }
            
            const saturationSpec = {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "description": "A simple line chart with embedded data.",
                "data": {"values": zipArraysToObjects(selectedZeroD.saturation_curve())},
                "mark": "line",
                "encoding": {
                    "x": {"field": "0", "type": "quantitative", "title": "Time"},
                    "y": {"field": "1", "type": "quantitative", "title": "Coverage"}
                }
            };
            vegaEmbed('#vis', saturationSpec, { "actions": false }).catch(console.error);
        });
    }

    // Event listener for precursor selection
    const precursorSelect = document.getElementById('precursor-select');
    if (precursorSelect) {
        precursorSelect.addEventListener('change', function() {
            const selectedPrecursor = this.value;
            
            if (selectedPrecursor === 'H2O') {
                // Update molar mass to 18.01 g/mol
                const molarMassInput = document.getElementById('molar-mass');
                if (molarMassInput) {
                    molarMassInput.value = '18.01';
                }
                
                // Update temperature to 500K
                const temperatureInput = document.getElementById('temperature');
                if (temperatureInput) {
                    temperatureInput.value = '500';
                }
                
                // Update pressure to 0.80 Pa
                const pressureInput = document.getElementById('pressure');
                if (pressureInput) {
                    pressureInput.value = '0.80';
                }
                
                // Update precursor and ZeroD instances with new parameters
                createPrecursorInstances();
                createZeroDInstances();
                
                console.log('H2O precursor selected - Updated values: Molar Mass=18.01, Temperature=500K, Pressure=0.80 Pa');
            } else {
                // For TMA, update precursor and ZeroD instances with current parameters
                createPrecursorInstances();
                createZeroDInstances();
                
                console.log('TMA precursor selected - Updated instances with current parameters');
            }
        });
    }

    // Tab functionality
    tabElements.forEach(tab => {
        tab.addEventListener('click', function() {
            // Deactivate all tabs
            tabElements.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('border-indigo-500', 'text-indigo-600', 'border-b-2');
                t.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
                const target = document.querySelector(t.dataset.tabsTarget);
                if (target) {
                    target.classList.add('hidden');
                }
            });

            // Activate clicked tab
            this.setAttribute('aria-selected', 'true');
            this.classList.add('border-indigo-500', 'text-indigo-600', 'border-b-2');
            this.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            const targetPanel = document.querySelector(this.dataset.tabsTarget);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });

    // Activate the "Simulate" tab by default
    const simulateTabButton = document.getElementById('simulate-tab');
    if (simulateTabButton) {
        simulateTabButton.click();
    }

       // Precursor Level Display Logic
    function getRandomPercentage(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function updatePrecursorLevelDisplay(elementId) {
        const displayElement = document.getElementById(elementId);
        if (!displayElement) return;

        const percentage = getRandomPercentage(5, 95);
        displayElement.textContent = `${percentage}%`;

        // Remove existing color classes
        displayElement.classList.remove('bg-green-500', 'bg-yellow-400', 'bg-red-500', 'text-gray-800');

        if (percentage >= 50) {
            displayElement.classList.add('bg-green-500');
            displayElement.classList.add('text-white');
        } else if (percentage >= 15) {
            displayElement.classList.add('bg-yellow-400');
            displayElement.classList.add('text-gray-800'); // Darker text for yellow background
        } else {
            displayElement.classList.add('bg-red-500');
            displayElement.classList.add('text-white');
        }
    }

    updatePrecursorLevelDisplay('precursor-level-1-value');
    updatePrecursorLevelDisplay('precursor-level-2-value');

        // Chamber Pressure Display Logic
    const chamberPressureDisplayElement = document.getElementById('chamber-pressure-value');
    if (chamberPressureDisplayElement) {
        chamberPressureDisplayElement.textContent = `1.000 Torr`;
    }

    // Particle Counter Logic
    let atomCount = Math.floor(Math.random() * 96) + 5; // Random integer between 5 and 100
    const particleCountDisplayElement = document.getElementById('particle-count-value');
    if (particleCountDisplayElement) {
        particleCountDisplayElement.textContent = atomCount;
    }

    function updateAtomCount(newCount) {
        if (particleCountDisplayElement) {
            atomCount = Math.max(0, Math.min(100, newCount)); // Clamp between 0 and 100
            particleCountDisplayElement.textContent = atomCount;
        }
    }

    function animateAtomCount(startCount, endCount, durationMs) {
        const steps = Math.abs(endCount - startCount);
        if (steps === 0) return; // Nothing to animate

        const intervalMs = durationMs / steps;
        let currentCount = startCount;

        const intervalId = setInterval(() => {
            if (startCount < endCount) {
                currentCount++;
            } else {
                currentCount--;
            }
            updateAtomCount(currentCount);

            if ((startCount < endCount && currentCount >= endCount) ||
                (startCount >= endCount && currentCount <= endCount)) {
                clearInterval(intervalId);
            }
        }, intervalMs);
    }

    const pulseButton = document.getElementById('pulse-button');
    const purgeButton = document.getElementById('purge-button');
    let isAnimating = false; // Prevent multiple animations

    function handleControlButton(button, targetCount) {
        if (isAnimating) return; // Prevent overlapping animations
        isAnimating = true;
        button.classList.add('bg-opacity-50'); // Visual feedback for "clicked" state

        animateAtomCount(atomCount, targetCount, 5000);

        setTimeout(() => {
            button.classList.remove('bg-opacity-50');
            isAnimating = false;
        }, 5000); // Match animation duration
    }

    if (pulseButton && purgeButton) {
        pulseButton.addEventListener('click', () => {
            handleControlButton(pulseButton, 100);
        });

        purgeButton.addEventListener('click', () => {
            handleControlButton(purgeButton, 0);
        });
    }
});