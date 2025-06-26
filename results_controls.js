// Results Controls Module
document.addEventListener('DOMContentLoaded', function() {
    // Data arrays to store last 100 values for each metric
    let pressureData = [];
    let temperatureData = [];
    let thicknessData = [];
    let yieldData = [];
    let timeData = [];
    
    // Chart instance
    let chart = null;
    let isInitialized = false;
    let dataInterval = null;
    
    // DOM elements
    const dataTypeSelect = document.getElementById('data-type');
    const chartContainer = document.getElementById('stock-chart');
    
    // Initialize data arrays with initial values
    function initializeDataArrays() {
        const now = new Date();
        for (let i = 99; i >= 0; i--) {
            const time = new Date(now.getTime() - (99 - i) * 1000);
            timeData[i] = time;
            
            // Generate initial random values
            pressureData[i] = generateRandomPressure();
            temperatureData[i] = generateRandomTemperature();
            thicknessData[i] = generateRandomThickness();
            yieldData[i] = generateRandomYield();
        }
    }
    
    // Generate random values for each metric
    function generateRandomPressure() {
        return Math.random() * 0.0008 + 0.0001; // 0.0001 to 0.0009 Torr
    }
    
    function generateRandomTemperature() {
        return Math.random() * 50 + 100; // 100 to 150°C
    }
    
    function generateRandomThickness() {
        return Math.random() * 1 + 2; // 2 to 3 nm
    }
    
    function generateRandomYield() {
        return Math.random() * 30 + 50; // 50 to 80 percent
    }
    
    // Update data arrays with new values
    function updateDataArrays() {
        const now = new Date();
        
        // Remove oldest data point and add new one
        timeData.shift();
        pressureData.shift();
        temperatureData.shift();
        thicknessData.shift();
        yieldData.shift();
        
        // Add new data points
        timeData.push(now);
        pressureData.push(generateRandomPressure());
        temperatureData.push(generateRandomTemperature());
        thicknessData.push(generateRandomThickness());
        yieldData.push(generateRandomYield());
        
        // Update chart if it exists
        updateChart();
    }
    
    // Create Dygraph chart
    function createChart() {
        if (chart) {
            chart.destroy();
        }
        
        const selectedDataType = dataTypeSelect.value;
        let data = [];
        
        // Prepare data based on selected type
        for (let i = 0; i < timeData.length; i++) {
            let value;
            switch (selectedDataType) {
                case 'pressure':
                    value = pressureData[i];
                    break;
                case 'temperature':
                    value = temperatureData[i];
                    break;
                case 'thickness':
                    value = thicknessData[i];
                    break;
                case 'yield':
                    value = yieldData[i];
                    break;
                default:
                    value = pressureData[i];
            }
            data.push([timeData[i], value]);
        }
        // Create chart
        chart = new Dygraph(chartContainer, data, {
            title: `${selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)} vs Time`,
            xlabel: 'Time',
            ylabel: getYAxisLabel(selectedDataType),
            drawPoints: true,
            pointSize: 2,
            strokeWidth: 1.5,
            colors: ['#1f77b4'],
            gridLineColor: '#e0e0e0',
            axisLineColor: '#666',
            axisLabelColor: '#333',
            titleHeight: 30,
            xAxisHeight: 50,
            yAxisWidth: 60,
            legend: 'never',
            animatedZooms: true,
            showRangeSelector: true,
            rangeSelectorHeight: 30,
            rangeSelectorPlotStrokeColor: '#1f77b4',
            rangeSelectorPlotFillColor: '#1f77b4'
        });
    }
    
    // Update chart with new data
    function updateChart() {
        if (!chart) return;
        
        const selectedDataType = dataTypeSelect.value;
        let data = [];
        
        // Prepare data based on selected type
        for (let i = 0; i < timeData.length; i++) {
            let value;
            switch (selectedDataType) {
                case 'pressure':
                    value = pressureData[i];
                    break;
                case 'temperature':
                    value = temperatureData[i];
                    break;
                case 'thickness':
                    value = thicknessData[i];
                    break;
                case 'yield':
                    value = yieldData[i];
                    break;
                default:
                    value = pressureData[i];
            }
            data.push([timeData[i], value]);
        }
        
        chart.updateOptions({
            file: data,
            title: `${selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)} vs Time`,
            ylabel: getYAxisLabel(selectedDataType)
        });
    }
    
    // Get Y-axis label based on data type
    function getYAxisLabel(dataType) {
        switch (dataType) {
            case 'pressure':
                return 'Pressure (Torr)';
            case 'temperature':
                return 'Temperature (°C)';
            case 'thickness':
                return 'Thickness (nm)';
            case 'yield':
                return 'Yield (%)';
            default:
                return 'Value';
        }
    }
    
    // Event listener for dropdown change
    if (dataTypeSelect) {
        dataTypeSelect.addEventListener('change', function() {
            if (isInitialized) {
                createChart();
            }
        });
    }
    
    // Initialize everything
    function initialize() {
        if (isInitialized) return; // Prevent double initialization
        
        initializeDataArrays();
        
        // Set temperature as default value in dropdown
        if (dataTypeSelect) {
            dataTypeSelect.value = 'temperature';
        }
        
        createChart();
        console.log("Chart created");
        
        // Start data generation every second
        dataInterval = setInterval(updateDataArrays, 1000);
        
        isInitialized = true;
    }
    
    // Listen for results tab selection
    const resultsTab = document.getElementById('results-tab');
    if (resultsTab) {
        resultsTab.addEventListener('click', function() {
            // Small delay to ensure tab is fully activated
            setTimeout(() => {
                if (!isInitialized) {
                    initialize();
                }
            }, 100);
        });
    }
}); 