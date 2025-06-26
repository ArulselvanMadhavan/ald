document.addEventListener('DOMContentLoaded', () => {
    const pumpDownButton = document.getElementById('pump-down-button');
    const ventButton = document.getElementById('vent-button');
    const chamberPressureDisplay = document.getElementById('chamber-pressure-value');
    const atomDisplay = document.getElementById('atom-count-display');

    let currentPressure = 1.0; // Default pressure in Torr
    let currentAtomCount = 50; // Default atom count
    let operationInterval = null;

    // Tailwind classes for button states
    const pumpDownButtonClasses = {
        default: ['bg-blue-500', 'hover:bg-blue-600', 'text-white'],
        active: ['bg-blue-700', 'text-blue-100', 'cursor-wait']
    };
    const ventButtonClasses = {
        default: ['bg-green-500', 'hover:bg-green-600', 'text-white'],
        active: ['bg-green-700', 'text-green-100', 'cursor-wait']
    };

    function applyButtonStyles(button, styleSet) {
        const allPossibleStyles = [
            ...pumpDownButtonClasses.default, ...pumpDownButtonClasses.active,
            ...ventButtonClasses.default, ...ventButtonClasses.active
        ];
        allPossibleStyles.forEach(c => button.classList.remove(c));
        styleSet.forEach(c => button.classList.add(c));
    }

    function updatePressureDisplay(pressure) {
        if (chamberPressureDisplay) {
            chamberPressureDisplay.textContent = `${pressure.toFixed(3)} Torr`;
        }
    }

    function updateAtomDisplay(count) {
        if (atomDisplay) {
            atomDisplay.textContent = Math.round(count);
        }
    }

    function initializeChamberControls() {
        // Get current pressure from display if it exists
        if (chamberPressureDisplay && chamberPressureDisplay.textContent) {
            const pressureText = chamberPressureDisplay.textContent;
            const pressureMatch = pressureText.match(/(\d+\.?\d*)/);
            if (pressureMatch) {
                currentPressure = parseFloat(pressureMatch[1]);
            }
        }

        // Get current atom count from display if it exists
        if (atomDisplay && atomDisplay.textContent) {
            const atomText = atomDisplay.textContent;
            const atomMatch = atomText.match(/(\d+)/);
            if (atomMatch) {
                currentAtomCount = parseInt(atomMatch[1]);
            }
        }

        applyButtonStyles(pumpDownButton, pumpDownButtonClasses.default);
        applyButtonStyles(ventButton, ventButtonClasses.default);

        pumpDownButton.disabled = false;
        ventButton.disabled = false;
    }

    function startPumpDown() {
        // Prevent starting a new operation if one is already in progress
        if (pumpDownButton.disabled || ventButton.disabled) {
            return;
        }

        // Disable buttons
        pumpDownButton.disabled = true;
        ventButton.disabled = true;

        // Apply "active" styling to the pump down button
        applyButtonStyles(pumpDownButton, pumpDownButtonClasses.active);

        const startPressure = currentPressure;
        const startAtomCount = currentAtomCount;
        // Target pressure in 10^-3 Torr range (0.001 to 0.009 Torr)
        const targetPressure = (Math.random() * 0.008 + 0.001);
        const targetAtomCount = 0; // Changed from 10 to 0 to allow particle counter to go to 0
        const durationSeconds = 5;
        const pressureChangePerStep = (targetPressure - startPressure) / durationSeconds;
        const atomChangePerStep = (targetAtomCount - startAtomCount) / durationSeconds;
        let elapsedSteps = 0;

        operationInterval = setInterval(() => {
            elapsedSteps++;
            
            let newPressure = startPressure + (pressureChangePerStep * elapsedSteps);
            currentPressure = Math.max(0.001, newPressure); // Ensure pressure doesn't go below 0.001 Torr

            let newAtomCount = startAtomCount + (atomChangePerStep * elapsedSteps);
            currentAtomCount = Math.max(0, Math.min(100, newAtomCount)); // Clamp between 0 and 100

            updatePressureDisplay(currentPressure);
            updateAtomDisplay(currentAtomCount);

            if (elapsedSteps >= durationSeconds) {
                clearInterval(operationInterval);
                operationInterval = null;

                currentPressure = targetPressure; // Ensure final value is exact
                currentAtomCount = targetAtomCount; // Ensure final value is exact
                updatePressureDisplay(currentPressure);
                updateAtomDisplay(currentAtomCount);

                // Re-enable buttons and restore default styles
                pumpDownButton.disabled = false;
                ventButton.disabled = false;
                applyButtonStyles(pumpDownButton, pumpDownButtonClasses.default);
                applyButtonStyles(ventButton, ventButtonClasses.default);
            }
        }, 1000); // Update every second
    }

    function startVent() {
        // Prevent starting a new operation if one is already in progress
        if (pumpDownButton.disabled || ventButton.disabled) {
            return;
        }

        // Disable buttons
        pumpDownButton.disabled = true;
        ventButton.disabled = true;

        // Apply "active" styling to the vent button
        applyButtonStyles(ventButton, ventButtonClasses.active);

        const startPressure = currentPressure;
        const startAtomCount = currentAtomCount;
        // Target pressure around atmospheric pressure (760 Torr)
        const targetPressure = 760;
        const targetAtomCount = 100;
        const durationSeconds = 5;
        const pressureChangePerStep = (targetPressure - startPressure) / durationSeconds;
        const atomChangePerStep = (targetAtomCount - startAtomCount) / durationSeconds;
        let elapsedSteps = 0;

        operationInterval = setInterval(() => {
            elapsedSteps++;
            
            let newPressure = startPressure + (pressureChangePerStep * elapsedSteps);
            currentPressure = Math.max(0.001, newPressure);

            let newAtomCount = startAtomCount + (atomChangePerStep * elapsedSteps);
            currentAtomCount = Math.max(0, Math.min(100, newAtomCount)); // Clamp between 0 and 100

            updatePressureDisplay(currentPressure);
            updateAtomDisplay(currentAtomCount);

            if (elapsedSteps >= durationSeconds) {
                clearInterval(operationInterval);
                operationInterval = null;

                currentPressure = targetPressure; // Ensure final value is exact
                currentAtomCount = targetAtomCount; // Ensure final value is exact
                updatePressureDisplay(currentPressure);
                updateAtomDisplay(currentAtomCount);

                // Re-enable buttons and restore default styles
                pumpDownButton.disabled = false;
                ventButton.disabled = false;
                applyButtonStyles(pumpDownButton, pumpDownButtonClasses.default);
                applyButtonStyles(ventButton, ventButtonClasses.default);
            }
        }, 1000); // Update every second
    }

    // Event Listeners
    if (pumpDownButton) {
        pumpDownButton.addEventListener('click', startPumpDown);
    }

    if (ventButton) {
        ventButton.addEventListener('click', startVent);
    }

    // Initialize the chamber controls when the page loads
    initializeChamberControls();
}); 