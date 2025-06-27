document.addEventListener('DOMContentLoaded', () => {
    const heatUpButton = document.getElementById('heat-up-button');
    const coolDownButton = document.getElementById('cool-down-button');
    const chamberTemperatureDisplay = document.getElementById('chamber-temperature-value');

    let currentTemperature = 30; // Default temperature in Celsius
    let operationInterval = null;

    // Tailwind classes for button states
    const heatUpButtonClasses = {
        default: ['bg-red-500', 'hover:bg-red-600', 'text-white'],
        active: ['bg-red-700', 'text-red-100', 'cursor-wait']
    };

    const coolDownButtonClasses = {
        default: ['bg-blue-500', 'hover:bg-blue-600', 'text-white'],
        active: ['bg-blue-700', 'text-blue-100', 'cursor-wait']
    };

    function applyButtonStyles(button, styleSet) {
        const allPossibleStyles = [
            ...heatUpButtonClasses.default, ...heatUpButtonClasses.active,
            ...coolDownButtonClasses.default, ...coolDownButtonClasses.active
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

    function getRandomCoolDownTemperature() {
        // Generate random temperature between 25 and 30 Celsius for cool down
        return Math.random() * (30 - 25) + 25;
    }

    function initializeTemperatureControls() {
        // Set initial random temperature
        currentTemperature = getRandomTemperature();
        updateTemperatureDisplay(currentTemperature);

        applyButtonStyles(heatUpButton, heatUpButtonClasses.default);
        applyButtonStyles(coolDownButton, coolDownButtonClasses.default);
        heatUpButton.disabled = false;
        coolDownButton.disabled = false;
    }

    function startHeatUp() {
        // Prevent starting a new operation if one is already in progress
        if (heatUpButton.disabled) {
            return;
        }

        // Disable both buttons during operation
        heatUpButton.disabled = true;
        coolDownButton.disabled = true;

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

                // Re-enable both buttons and restore default styles
                heatUpButton.disabled = false;
                coolDownButton.disabled = false;
                applyButtonStyles(heatUpButton, heatUpButtonClasses.default);
                applyButtonStyles(coolDownButton, coolDownButtonClasses.default);
            }
        }, 1000); // Update every second
    }

    function startCoolDown() {
        // Prevent starting a new operation if one is already in progress
        if (coolDownButton.disabled) {
            return;
        }

        // Disable both buttons during operation
        heatUpButton.disabled = true;
        coolDownButton.disabled = true;

        // Apply "active" styling to the cool down button
        applyButtonStyles(coolDownButton, coolDownButtonClasses.active);

        const startTemperature = currentTemperature;
        const targetTemperature = getRandomCoolDownTemperature(); // Random target between 25-30°C
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

                // Re-enable both buttons and restore default styles
                heatUpButton.disabled = false;
                coolDownButton.disabled = false;
                applyButtonStyles(heatUpButton, heatUpButtonClasses.default);
                applyButtonStyles(coolDownButton, coolDownButtonClasses.default);
            }
        }, 1000); // Update every second
    }

    // Event Listeners
    if (heatUpButton) {
        heatUpButton.addEventListener('click', startHeatUp);
    }

    if (coolDownButton) {
        coolDownButton.addEventListener('click', startCoolDown);
    }

    // Initialize the temperature controls when the page loads
    initializeTemperatureControls();
}); 