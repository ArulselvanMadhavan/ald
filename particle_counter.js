document.addEventListener('DOMContentLoaded', () => {
    const atomDisplay = document.getElementById('atom-count-display');
    const pulseButton = document.getElementById('pulse-button');
    const purgeButton = document.getElementById('purge-button');
    const chamberPressureDisplay = document.getElementById('chamber-pressure-value');
    const chamberTemperatureDisplay = document.getElementById('chamber-temperature-value');
    const flowRateInput = document.getElementById('flow-rate-input');

    let currentAtomCount = 0;
    let operationInterval = null; // To store the interval ID and prevent overlaps
    let pulseCompleted = false; // Track if pulse has been completed
    let cycleCompleted = false; // Track if a complete cycle (pulse + purge) has been completed

    // Tailwind classes for button states
    const pulseButtonClasses = {
        default: ['bg-purple-500', 'hover:bg-purple-600', 'text-white'],
        active: ['bg-purple-700', 'text-purple-100', 'cursor-wait'], // "Clicked" state
        disabled: ['bg-gray-400', 'text-gray-600', 'cursor-not-allowed'] // Disabled state
    };
    const purgeButtonClasses = {
        default: ['bg-red-500', 'hover:bg-red-600', 'text-white'],
        active: ['bg-red-700', 'text-red-100', 'cursor-wait'], // "Clicked" state
        disabled: ['bg-gray-400', 'text-gray-600', 'cursor-not-allowed'] // Disabled state
    };

    function applyButtonStyles(button, styleSet) {
        const allPossibleStyles = [
            ...pulseButtonClasses.default, ...pulseButtonClasses.active, ...pulseButtonClasses.disabled,
            ...purgeButtonClasses.default, ...purgeButtonClasses.active, ...purgeButtonClasses.disabled
        ];
        allPossibleStyles.forEach(c => button.classList.remove(c));
        styleSet.forEach(c => button.classList.add(c));
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function updateAtomDisplay(count) {
        atomDisplay.textContent = Math.round(count); // Ensure integer display
    }

    function getCurrentChamberPressure() {
        if (chamberPressureDisplay && chamberPressureDisplay.textContent) {
            const pressureText = chamberPressureDisplay.textContent;
            const pressureMatch = pressureText.match(/(\d+\.?\d*)/);
            if (pressureMatch) {
                return parseFloat(pressureMatch[1]);
            }
        }
        return 1.0; // Default pressure if can't read
    }

    function getCurrentChamberTemperature() {
        if (chamberTemperatureDisplay && chamberTemperatureDisplay.textContent) {
            const temperatureText = chamberTemperatureDisplay.textContent;
            const temperatureMatch = temperatureText.match(/(\d+\.?\d*)/);
            if (temperatureMatch) {
                return parseFloat(temperatureMatch[1]);
            }
        }
        return 30; // Default temperature if can't read
    }

    function getCurrentFlowRate() {
        if (flowRateInput && flowRateInput.value) {
            const flowRate = parseInt(flowRateInput.value);
            // Ensure flow rate is between 1 and 4
            return Math.max(1, Math.min(4, flowRate));
        }
        return 1; // Default flow rate if can't read
    }

    function updateChamberPressure(newPressure) {
        if (chamberPressureDisplay) {
            chamberPressureDisplay.textContent = `${newPressure.toFixed(3)} Torr`;
        }
    }

    function updateChamberTemperature(newTemperature) {
        if (chamberTemperatureDisplay) {
            chamberTemperatureDisplay.textContent = `${newTemperature.toFixed(1)}°C`;
        }
    }

    function isPressureInRange() {
        const pressure = getCurrentChamberPressure();
        // Check if pressure is less than 0.0099 Torr
        return pressure < 0.0099;
    }

    function isTemperatureInRange() {
        const temperature = getCurrentChamberTemperature();
        // Check if temperature is at 150°C
        return temperature >= 150;
    }

    function updateButtonStates() {
        const pressureInRange = isPressureInRange();
        const temperatureInRange = isTemperatureInRange();
        
        if (pressureInRange && temperatureInRange && !operationInterval) {
            // Only enable pulse button if conditions are met, no operation is in progress, and purge is not enabled
            if (!pulseCompleted || cycleCompleted) {
                pulseButton.disabled = false;
                applyButtonStyles(pulseButton, pulseButtonClasses.default);
            } else {
                pulseButton.disabled = true;
                applyButtonStyles(pulseButton, pulseButtonClasses.disabled);
            }
            
            // Only enable purge button if pulse has been completed and purge hasn't been used yet
            if (pulseCompleted && !cycleCompleted) {
                purgeButton.disabled = false;
                applyButtonStyles(purgeButton, purgeButtonClasses.default);
            } else {
                purgeButton.disabled = true;
                applyButtonStyles(purgeButton, purgeButtonClasses.disabled);
            }
        } else {
            // Disable buttons if conditions are not met or operation is in progress
            pulseButton.disabled = true;
            purgeButton.disabled = true;
            applyButtonStyles(pulseButton, pulseButtonClasses.disabled);
            applyButtonStyles(purgeButton, purgeButtonClasses.disabled);
        }
    }

    function initializeAtomCounter() {
        currentAtomCount = getRandomInt(5, 100);
        updateAtomDisplay(currentAtomCount);

        // Initialize cycle state
        pulseCompleted = false;
        cycleCompleted = false;

        // Set initial button states based on pressure and temperature
        updateButtonStates();
    }

    // Function to notify cycles controller when a complete cycle is finished
    function notifyCycleCompleted() {
        // Dispatch a custom event that the cycles controller can listen for
        const cycleEvent = new CustomEvent('cycleCompleted', {
            detail: {
                cycleNumber: 1, // Each pulse-purge sequence counts as 1 cycle
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(cycleEvent);
        console.log('Cycle completed: Pulse + Purge sequence finished');
    }

    function startOperation(initiatingButton, isPulseOperation) {
        // Prevent starting a new operation if one is already in progress or conditions are not met
        if (!isPressureInRange() || !isTemperatureInRange()) {
            console.log('Conditions not met');
            return;
        }

        // Disable buttons
        pulseButton.disabled = true;
        purgeButton.disabled = true;

        // Apply "active" (clicked) styling to the initiating button
        if (initiatingButton === pulseButton) {
            applyButtonStyles(pulseButton, pulseButtonClasses.active);
            pulseCompleted = false; // Reset pulse completion flag
        } else if (initiatingButton === purgeButton) {
            applyButtonStyles(purgeButton, purgeButtonClasses.active);
        }

        const startAtoms = currentAtomCount;
        let targetAtoms;
        let durationSeconds;
        
        if (isPulseOperation) {
            // For pulse operation, always increase to 100
            targetAtoms = 100;
            // Duration is inversely proportional to flow rate (higher flow rate = shorter duration)
            // Base duration is 10 seconds for flow rate 1, minimum 2 seconds
            const flowRate = getCurrentFlowRate();
            durationSeconds = Math.max(2, 10 / flowRate); // 10s for flow rate 1, 5s for flow rate 2, 3.33s for flow rate 3, 2.5s for flow rate 4, minimum 2s
        } else {
            // For purge operation, decrease to 0
            targetAtoms = 0;
            durationSeconds = 5;
        }
        
        const changePerStep = (targetAtoms - startAtoms) / durationSeconds;
        let elapsedSteps = 0;

        operationInterval = setInterval(() => {
            elapsedSteps++;
            
            let newAtomCountCalculated = startAtoms + (changePerStep * elapsedSteps);
            currentAtomCount = Math.round(newAtomCountCalculated);

            // Clamp values to be within [0, 100]
            currentAtomCount = Math.max(0, Math.min(100, currentAtomCount));

            updateAtomDisplay(currentAtomCount);

            if (elapsedSteps >= durationSeconds) {
                clearInterval(operationInterval);
                operationInterval = null;

                currentAtomCount = targetAtoms; // Ensure final value is exact
                updateAtomDisplay(currentAtomCount);

                // Track operation completion
                if (isPulseOperation) {
                    pulseCompleted = true;
                    cycleCompleted = false; // Reset cycle completion flag
                    // Keep pulse button disabled after pulse operation completes
                    pulseButton.disabled = true;
                    applyButtonStyles(pulseButton, pulseButtonClasses.disabled);
                    // Enable purge button
                    purgeButton.disabled = false;
                    applyButtonStyles(purgeButton, purgeButtonClasses.default);
                } else {
                    // Purge completed - check if this completes a cycle
                    if (pulseCompleted) {
                        cycleCompleted = true;
                        notifyCycleCompleted();
                        pulseCompleted = false; // Reset for next cycle
                        cycleCompleted = false; // Reset cycle completion flag
                        
                        // Update chamber conditions after purge operation completes
                        const currentPressure = getCurrentChamberPressure();
                        const currentTemperature = getCurrentChamberTemperature();
                        
                        // Increase pressure to random value within 1 Torr
                        const newPressure = Math.random() * 1.0; // Random value between 0 and 1 Torr
                        updateChamberPressure(newPressure);
                        
                        // Decrease temperature to random value between 120-150°C
                        const newTemperature = Math.random() * 30 + 120; // Random value between 120 and 150°C
                        updateChamberTemperature(newTemperature);
                        
                        console.log(`Purge operation completed - Pressure: ${newPressure.toFixed(3)} Torr, Temperature: ${newTemperature.toFixed(1)}°C`);
                        
                        // Keep purge button disabled after purge operation completes
                        purgeButton.disabled = true;
                        applyButtonStyles(purgeButton, purgeButtonClasses.disabled);
                        // Re-enable pulse button for next cycle
                        pulseButton.disabled = false;
                        applyButtonStyles(pulseButton, pulseButtonClasses.default);
                    }
                }
            }
        }, 1000); // Update every second
    }

    // Event Listeners
    if (pulseButton) {
        pulseButton.addEventListener('click', () => {
            console.log('Pulse button clicked');
            startOperation(pulseButton, true); // true for pulse
        });
    }

    if (purgeButton) {
        purgeButton.addEventListener('click', () => {
            console.log('Purge button clicked');
            startOperation(purgeButton, false); // false for purge
        });
    }

    // Function to programmatically trigger pulse button
    function triggerPulse() {
        if (pulseButton && !pulseButton.disabled && isPressureInRange() && isTemperatureInRange()) {
            startOperation(pulseButton, true); // true for pulse
            return true; // Return true if pulse was successfully triggered
        }
        return false; // Return false if pulse could not be triggered
    }

    // Make triggerPulse available globally for external use
    window.triggerPulse = triggerPulse;

    // Monitor chamber pressure and temperature changes
    function monitorConditions() {
        updateButtonStates();
    }

    // Set up a periodic check for pressure and temperature changes
    setInterval(monitorConditions, 1000);

    // Initialize the counter when the page loads
    initializeAtomCounter();
});