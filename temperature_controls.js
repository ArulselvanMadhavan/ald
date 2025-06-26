document.addEventListener('DOMContentLoaded', () => {
    const heatUpButton = document.getElementById('heat-up-button');
    const chamberTemperatureDisplay = document.getElementById('chamber-temperature-value');

    let currentTemperature = 30; // Default temperature in Celsius
    let operationInterval = null;

    // Tailwind classes for button states
    const heatUpButtonClasses = {
        default: ['bg-red-500', 'hover:bg-red-600', 'text-white'],
        active: ['bg-red-700', 'text-red-100', 'cursor-wait']
    };

    function applyButtonStyles(button, styleSet) {
        const allPossibleStyles = [
            ...heatUpButtonClasses.default, ...heatUpButtonClasses.active
        ];
        allPossibleStyles.forEach(c => button.classList.remove(c));
        styleSet.forEach(c => button.classList.add(c));
    }

    function updateTemperatureDisplay(temperature) {
        if (chamberTemperatureDisplay) {
            chamberTemperatureDisplay.textContent = `${temperature.toFixed(1)}°C`;
        }
    }

    function getRandomTemperature() {
        // Generate random temperature between 25 and 42 Celsius
        return Math.random() * (42 - 25) + 25;
    }

    function initializeTemperatureControls() {
        // Set initial random temperature
        currentTemperature = getRandomTemperature();
        updateTemperatureDisplay(currentTemperature);

        applyButtonStyles(heatUpButton, heatUpButtonClasses.default);
        heatUpButton.disabled = false;
    }

    function startHeatUp() {
        // Prevent starting a new operation if one is already in progress
        if (heatUpButton.disabled) {
            return;
        }

        // Disable button
        heatUpButton.disabled = true;

        // Apply "active" styling to the heat up button
        applyButtonStyles(heatUpButton, heatUpButtonClasses.active);

        const startTemperature = currentTemperature;
        const targetTemperature = 150; // Target temperature in Celsius
        const durationSeconds = 5;
        const temperatureChangePerStep = (targetTemperature - startTemperature) / durationSeconds;
        let elapsedSteps = 0;

        operationInterval = setInterval(() => {
            elapsedSteps++;
            
            let newTemperature = startTemperature + (temperatureChangePerStep * elapsedSteps);
            currentTemperature = Math.max(25, newTemperature); // Ensure temperature doesn't go below 25°C

            updateTemperatureDisplay(currentTemperature);

            if (elapsedSteps >= durationSeconds) {
                clearInterval(operationInterval);
                operationInterval = null;

                currentTemperature = targetTemperature; // Ensure final value is exact
                updateTemperatureDisplay(currentTemperature);

                // Re-enable button and restore default styles
                heatUpButton.disabled = false;
                applyButtonStyles(heatUpButton, heatUpButtonClasses.default);
            }
        }, 1000); // Update every second
    }

    // Event Listeners
    if (heatUpButton) {
        heatUpButton.addEventListener('click', startHeatUp);
    }

    // Initialize the temperature controls when the page loads
    initializeTemperatureControls();
}); 