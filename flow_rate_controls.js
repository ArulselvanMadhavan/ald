document.addEventListener('DOMContentLoaded', () => {
    const flowRateInput = document.getElementById('flow-rate-input');

    function validateFlowRate(value) {
        // Convert to integer
        const intValue = parseInt(value);
        
        // Check if it's a valid integer between 1 and 4
        if (isNaN(intValue) || intValue < 1 || intValue > 4) {
            return false;
        }
        
        return true;
    }

    function handleFlowRateChange() {
        const value = flowRateInput.value;
        
        if (!validateFlowRate(value)) {
            // Reset to valid value (1) if invalid
            flowRateInput.value = 1;
            return;
        }
        
        // Ensure the value is an integer
        flowRateInput.value = parseInt(value);
        
        // You can add additional logic here to handle the flow rate change
        console.log('Flow rate changed to:', flowRateInput.value, 'turns/pulse');
    }

    function handleFlowRateInput(event) {
        const value = event.target.value;
        
        // Allow empty input temporarily for better UX
        if (value === '') {
            return;
        }
        
        // Check if the input is valid
        if (!validateFlowRate(value)) {
            // Prevent invalid input
            event.preventDefault();
            return;
        }
    }

    function handleFlowRateBlur() {
        const value = flowRateInput.value;
        
        // If empty or invalid, set to default value
        if (value === '' || !validateFlowRate(value)) {
            flowRateInput.value = 1;
        } else {
            // Ensure it's an integer
            flowRateInput.value = parseInt(value);
        }
    }

    // Event listeners
    if (flowRateInput) {
        flowRateInput.addEventListener('change', handleFlowRateChange);
        flowRateInput.addEventListener('input', handleFlowRateInput);
        flowRateInput.addEventListener('blur', handleFlowRateBlur);
        
        // Initialize with default value
        flowRateInput.value = 1;
    }
}); 