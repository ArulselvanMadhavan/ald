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

    // Instantiate Precursor with name = "TMA"
    const tmaPrecursor = new Precursor("TMA");
    console.log("TMA Precursor Initialized:", tmaPrecursor); // Optional: for verification

    // Define variables for ALDideal arguments
    const nsitesValue = 1e19;
    const beta0Value = 1e-3;
    const fValue = 1;
    const dmValue = 1.0;
    // Instantiate ALDideal using the variables
    const aldIdealInstance = new ALDideal(tmaPrecursor, nsitesValue, beta0Value, fValue, dmValue);
    console.log("ALDideal Instance Initialized:", aldIdealInstance); // Optional: for verification
    
    // Instantiate ZeroD
    const zeroDModel = new ZeroD(aldIdealInstance, { T: 500, p: 0.1 * 1e5 / 760 });
    console.log("ZeroD Model Initialized:", zeroDModel); // Optional: for verification
    
    // Tab switching logic
    const tabElements = document.querySelectorAll('button[role="tab"]');

    var g; // Dygraph instance
    var data = {
        pressure: [],
        temperature: [],
        thickness: [],
        yield: []
    };

    var dataType = 'pressure'; // Initial data type

    var time = new Date();

    // Function to initialize data for a specific type
    function initializeData(type) {
        let mean = Object.keys(data).indexOf(type) + 1; // Assign mean based on index
        if (mean < 1) mean = 1; // Ensure mean is at least 1 for Poisson
        for (let i = 0; i < 10; i++) {
            time = new Date(time.getTime() + 1000);
            data[type].push([time, poisson(mean)]);
        }
    }

    // Initialize all data types
    Object.keys(data).forEach(initializeData);

    function updateChart(type) {
        if (!type) type = dataType; // Use current data type if not specified
        time = new Date(time.getTime() + 1000); // Add 1 second
        let mean = Object.keys(data).indexOf(type) + 1; // Assign mean based on index
        if (mean === -1) mean = 0;
        let value = poisson(mean);

        data[type].push([time, value]);
        if (data[type].length > 100) {
            data[type].shift(); // Maintain max 100 values
        }

        if (g) {
            g.updateOptions({ 'file': data[type] });
        }
    }

    function renderChart(type) {
        if (!type) type = dataType;
        let yLabel;
        switch (type) {
            case 'temperature': yLabel = 'Temperature (°C)'; break;
            case 'thickness': yLabel = 'Thickness (mm)'; break;
            case 'yield': yLabel = 'Yield Strength (MPa)'; break;
            default: yLabel = 'Pressure (psi)';
        }

        g = new Dygraph(document.getElementById("stock-chart"), data[type], {
            xLabelHeight: 20,
            xValueFormatter: function(ms) { return new Date(ms).toLocaleTimeString(); },
            xTicker: Dygraph.dateTicker,
            yLabelWidth: 20,
            ylabel: yLabel
        });
        dataType = type;
    }

    setInterval(updateChart, 1000);

    // Dropdown event listener for the Results tab
    const dataTypeDropdown = document.getElementById('data-type');
    if (dataTypeDropdown) {
        dataTypeDropdown.addEventListener('change', function() {
            dataType = this.value;
            // Only render if the results tab is active
            const resultsTab = document.getElementById('results-tab');
            if (resultsTab && resultsTab.getAttribute('aria-selected') === 'true') {
                renderChart(dataType);
            }
        });
    }

    // Event listener for "Plot Saturation curve" button
    const plotButton = document.getElementById('plot-saturation-button');
    if (plotButton) {
        plotButton.addEventListener('click', function() {
            const saturationSpec = {
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "description": "A simple line chart with embedded data.",
                "data": {"values": zipArraysToObjects(zeroDModel.saturation_curve())},
                "mark": "line",
                "encoding": {
                    "x": {"field": "0", "type": "quantitative", "title": "Time"},
                    "y": {"field": "1", "type": "quantitative", "title": "Coverage"}
                }
            };
            vegaEmbed('#vis', saturationSpec, { "actions": false }).catch(console.error);
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

            // If results tab is activated, render or resize chart
            if (this.id === 'results-tab') {
                if (!g && document.getElementById("stock-chart")) { // Ensure chart div exists
                    renderChart(dataType);
                } else if (g) {
                    g.resize();
                }
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