document.addEventListener('DOMContentLoaded', () => {
    const cyclesInput = document.getElementById('cycles-input');
    const thicknessChart = document.getElementById('thickness-chart');
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');

    // Global variables to track cycles and thickness
    let currentCycleCount = 1; // Initialize to 1
    let thicknessArray = [{cycle: 1, thickness: 0}]; // Initialize with 0 Angstrom for cycle 1
    let isRecipeRunning = false;
    let isSequenceRunning = false;

    // Validate cycles input
    function validateCyclesInput() {
        const value = parseInt(cyclesInput.value);
        if (value < 1) {
            cyclesInput.value = 1;
        } else if (value > 10) {
            cyclesInput.value = 10;
        }
    }

    // Logarithmic growth function for thickness
    // Maximum thickness is 10 Angstroms
    function calculateThickness(cycles) {
        // Using log base 2 for a nice growth curve
        // This gives us: 1 cycle = ~0.5Å, 2 cycles = ~1Å, 4 cycles = ~2Å, 8 cycles = ~3Å, 10 cycles = ~3.3Å
        const maxThickness = 10;
        const logBase = 2;
        const thickness = maxThickness * (Math.log(cycles + 1) / Math.log(11)); // +1 to avoid log(0), 11 to normalize to max
        return Math.min(maxThickness, thickness);
    }

    // Add new cycles and update thickness array
    function addCycles(numCycles) {
        const cyclesToAdd = parseInt(numCycles);
        if (isNaN(cyclesToAdd) || cyclesToAdd < 1) return;

        // Add new cycles to the thickness array
        for (let i = 0; i < cyclesToAdd; i++) {
            currentCycleCount++;
            const thickness = calculateThickness(currentCycleCount);
            thicknessArray.push({
                cycle: currentCycleCount,
                thickness: thickness
            });
        }

        // Update the graph
        updateThicknessChart();
        
        console.log(`Added ${cyclesToAdd} cycles. Total cycles: ${currentCycleCount}, Current thickness: ${thicknessArray[thicknessArray.length - 1].thickness.toFixed(2)}Å`);
    }

    // Add a single cycle (called when pulse-purge sequence completes)
    function addSingleCycle() {
        if (!isRecipeRunning) return; // Only add cycles when recipe is running
        
        currentCycleCount++;
        const thickness = calculateThickness(currentCycleCount);
        thicknessArray.push({
            cycle: currentCycleCount,
            thickness: thickness
        });

        // Update the graph
        updateThicknessChart();
        
        console.log(`Cycle ${currentCycleCount} completed. Current thickness: ${thickness.toFixed(2)}Å`);
    }

    // Automated sequence function
    async function runAutomatedSequence() {
        if (isSequenceRunning) return;
        
        isSequenceRunning = true;
        isRecipeRunning = true;
        
        // Disable the start button
        startButton.disabled = true;
        startButton.textContent = 'Running...';
        startButton.classList.remove('bg-green-500', 'hover:bg-green-600');
        startButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        
        const numCycles = parseInt(cyclesInput.value) || 1;
        console.log(`Starting automated sequence for ${numCycles} cycles`);
        
        try {
            for (let cycle = 1; cycle <= numCycles; cycle++) {
                console.log(`Starting cycle ${cycle}/${numCycles}`);
                
                // Step 1: Pump down
                console.log('Step 1: Pumping down...');
                await triggerButtonClick('pump-down-button');
                await waitForOperation(5000); // Wait 5 seconds for pump down
                
                // Step 2: Heat up
                console.log('Step 2: Heating up...');
                await triggerButtonClick('heat-up-button');
                await waitForOperation(5000); // Wait 5 seconds for heat up
                
                // Step 3: Pulse
                console.log('Step 3: Pulsing...');
                await triggerButtonClick('pulse-button');
                await waitForOperation(10000); // Wait 10 seconds for pulse (max duration)
                
                // Step 4: Purge
                console.log('Step 4: Purging...');
                await triggerButtonClick('purge-button');
                await waitForOperation(5000); // Wait 5 seconds for purge
                
                // Add cycle to thickness tracking
                addSingleCycle();
                
                console.log(`Cycle ${cycle}/${numCycles} completed`);
                
                // Small delay between cycles
                if (cycle < numCycles) {
                    await waitForOperation(1000);
                }
            }
            
            console.log('Automated sequence completed successfully');
            
        } catch (error) {
            console.error('Error in automated sequence:', error);
        } finally {
            // Re-enable the start button
            startButton.disabled = false;
            startButton.textContent = 'Run recipe';
            startButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
            startButton.classList.add('bg-green-500', 'hover:bg-green-600');
            
            isSequenceRunning = false;
            isRecipeRunning = false;
        }
    }

    // Helper function to trigger button clicks
    function triggerButtonClick(buttonId) {
        const button = document.getElementById(buttonId);
        if (button && !button.disabled) {
            button.click();
            return true;
        }
        return false;
    }

    // Helper function to wait for a specified time
    function waitForOperation(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    // Generate data for the chart (now uses actual thickness array)
    function generateChartData() {
        // Always use the actual thickness array
        return thicknessArray;
    }

    // Create Vega-Lite specification
    function createChartSpec() {
        const data = generateChartData();
        
        // Determine the domain for x-axis based on actual data
        const maxCycle = data.length > 0 ? Math.max(...data.map(d => d.cycle)) : 1;
        const xDomain = [1, Math.max(10, maxCycle)];
        
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            title: {
                text: 'Thickness vs Cycle Count',
                fontSize: 16,
                fontWeight: 'bold'
            },
            height: 400,
            data: {
                values: data
            },
            mark: {
                type: 'line',
                point: true,
                strokeWidth: 2,
                color: '#3B82F6'
            },
            encoding: {
                x: {
                    field: 'cycle',
                    type: 'quantitative',
                    title: 'Cycle Count',
                    scale: {
                        domain: xDomain
                    }
                },
                y: {
                    field: 'thickness',
                    type: 'quantitative',
                    title: 'Thickness (Å)',
                    scale: {
                        domain: [0, 10]
                    }
                },
                tooltip: [
                    {
                        field: 'cycle',
                        title: 'Cycle',
                        type: 'quantitative',
                        format: '.0f'
                    },
                    {
                        field: 'thickness',
                        title: 'Thickness',
                        type: 'quantitative',
                        format: '.2f'
                    }
                ]
            },
            config: {
                axis: {
                    labelFontSize: 12,
                    titleFontSize: 14
                },
                title: {
                    fontSize: 16
                }
            }
        };
    }

    // Update the chart
    function updateThicknessChart() {
        if (thicknessChart) {
            const spec = createChartSpec();
            vegaEmbed(thicknessChart, spec, {
                actions: false,
                theme: 'default'
            });
        }
    }

    // Reset function to clear cycle counter and thickness array
    function resetCycles() {
        currentCycleCount = 1;
        thicknessArray = [{cycle: 1, thickness: 0}];
        isRecipeRunning = false;
        isSequenceRunning = false;
        updateThicknessChart();
        console.log('Cycles and thickness reset to initial state');
    }

    // Start recipe function
    function startRecipe() {
        if (isSequenceRunning) return;
        runAutomatedSequence();
    }

    // Stop recipe function
    function stopRecipe() {
        isRecipeRunning = false;
        isSequenceRunning = false;
        
        // Re-enable the start button if it was disabled
        if (startButton.disabled) {
            startButton.disabled = false;
            startButton.textContent = 'Run recipe';
            startButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
            startButton.classList.add('bg-green-500', 'hover:bg-green-600');
        }
        
        console.log('Recipe stopped');
    }

    // Event listeners
    if (cyclesInput) {
        cyclesInput.addEventListener('input', validateCyclesInput);
        cyclesInput.addEventListener('change', validateCyclesInput);
        cyclesInput.addEventListener('blur', validateCyclesInput);
    }

    // Listen for "Run recipe" button clicks
    if (startButton) {
        startButton.addEventListener('click', startRecipe);
    }

    // Listen for "Stop Recipe" button clicks
    if (stopButton) {
        stopButton.addEventListener('click', stopRecipe);
    }

    // Listen for cycle completion events from particle counter
    document.addEventListener('cycleCompleted', (event) => {
        // This will be called automatically by the particle counter
        // but we don't need to add cycles here since we're doing it in the sequence
        currentCycleCount++;
        const thickness = calculateThickness(currentCycleCount);
        thicknessArray.push({
            cycle: currentCycleCount,
            thickness: thickness
        });
        updateThicknessChart();
        console.log('Cycle completed');
    });

    // Initialize the chart with initial data
    updateThicknessChart();
}); 