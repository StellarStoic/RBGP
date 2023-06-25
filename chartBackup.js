let ctx = document.getElementById('myChart').getContext('2d');
let myChart; // Declare myChart in global scope
let delayed;
let colorMap = {};

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    
    var hDisplay = h > 0 ? (h < 10 ? "0" : "") + h + ":" : "00:";
    var mDisplay = m > 0 ? (m < 10 ? "0" : "") + m + ":" : "00:";
    var sDisplay = s > 0 ? (s < 10 ? "0" : "") + s : "00";
    return hDisplay + mDisplay + sDisplay; 
}


function clearChart() {
    if (myChart !== undefined && myChart !== null) {
        myChart.destroy();
        myChart = null;
    }
    window.selectedItems = [];
    colorMap = {};
}

function stringsMatch(str1, str2) {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' }) === 0;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function timeToSeconds(time) {
    if (!time) return;  // Add this to handle potential undefined times
    let parts = time.split(':');
    return parts[0] * 3600 + parts[1] * 60 + parseFloat(parts[2]);
}

let colorIndex = 0;
let colorPalette = [
    '#e6194b', '#3cb44b', '#ffe119', '#0082c8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe', 
    '#008080', '#e6beff', '#aa6e28', '#fffac8', '#800000', '#aaffc3', '#808000', '#000080', '#808080'
    , '#000000', '#f582f5', '#0000FF', '#018571', '#e31a1c',
];

// Generate colors
function getNextColor() {
    // Fetch a color from the array and increment the index
    let color = colorPalette[colorIndex];
    colorIndex = (colorIndex + 1) % colorPalette.length; // Cycle back to the start of the array if we run out of colors
    return color;
}


function updateChart() {
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Destroy existing chart if it exists
    if (typeof myChart !== "undefined" && myChart !== null) {
        myChart.destroy();
    }

    // Sort the selected items array by year
    window.selectedItems.sort((a, b) => a.year - b.year);

    // Extract unique years, this will be used as labels on the y-axis
    let years = [...new Set(window.selectedItems.map(item => item.year))].sort((a, b) => a - b);

    let datasets = [];

    window.selectedItems.forEach((item) => {
        let normalizedItemName = item.Name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let normalizedItemSurename = item.Surename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let id = normalizedItemName + normalizedItemSurename; // Removed the year from id creation
        if (!colorMap[id]) {
            colorMap[id] = getNextColor();
        }
        let lineColor = colorMap[id];
    
        // Find existing dataset for this person or create a new one
        let dataset = datasets.find(dataset => dataset.label === id);
        if (!dataset) {
            dataset = {
                label: capitalizeFirstLetter(item.Name) + ' ' + capitalizeFirstLetter(item.Surename) + ' \'' + item.year.toString().slice(-2), // Added year to the label
                data: [],
                fill: false,
                borderColor: lineColor,
                backgroundColor: lineColor,
                borderWidth: 2,
                pointStyle: 'triangle',
                pointRadius: 5,
                pointHoverRadius: 8,
            };
            datasets.push(dataset);
        }
        // Add data point
        if (item.Time) {
            dataset.data.push({
                x: item.year,
                y: timeToSeconds(item.Time)
            });
        }
    });
        

    
    

    // Only proceed if there are selected items
    if (window.selectedItems.length > 0) {
        myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: years,
        datasets: datasets
    },
    showLine: true,
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value, index, values) {
                        return secondsToHms(value);
                    }
                }
            },
            x: {
                beginAtZero: true,
            }
        },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                // Get the first tooltip item
                                let tooltipItem = tooltipItems[0];
                                
                                // Get the corresponding dataset and data point
                                let dataset = myChart.data.datasets[tooltipItem.datasetIndex];
                                let dataPoint = dataset.data[tooltipItem.dataIndex];
                            
                                // Extract name and surname from dataset label
                                let [name, surname] = dataset.label.split(' ');
                            
                                // Find the corresponding item in selectedItems
                                let item = window.selectedItems.find(item => 
                                    stringsMatch(item.Name, name) &&
                                    stringsMatch(item.Surename, surname) &&
                                    item.year === dataPoint.x
                                );
                            
                                if (item) {
                                    // Return an empty string as title
                                    return '';
                                } else {
                                    // If item is undefined, return a default string
                                    return 'Undefined item';
                                }
                            }
                            ,
                            label: function(context) {
                                var label = context.dataset.label || '';
                                if (label) {
                                    label += ', Bip: ';
                                }
                            
                                // Add bip number to the label
                                let datasetIndex = context.datasetIndex;
                                let dataIndex = context.dataIndex;
                                let dataset = myChart.data.datasets[datasetIndex];
                                let labelParts = dataset.label.split(' ');
                                let name = labelParts[0];
                                let surname = labelParts[1];
                                let item = window.selectedItems.find(item => 
                                    stringsMatch(item.Name, name) &&
                                    stringsMatch(item.Surename, surname) &&
                                    item.year === myChart.data.labels[dataIndex]
                                );
                                if (item) {
                                    label += item.Number + ', Time: ';
                                }
                            
                                if (context.parsed.y !== null) {
                                    label += secondsToHms(context.parsed.y);
                                }
                                return label;
                            }
                            
                        }
                    }
                }
                
            }
        });
    }
}




document.getElementById('results').addEventListener('change', function(e) {
    if (e.target.classList.contains('result-checkbox')) {
        let checkboxText = e.target.parentElement.textContent.trim();
        if (checkboxText) {
            let regex = /(.*) \[(.*)\] completed the (\d{4}) Goni Pony race in (.*)/;
            let matches = checkboxText.match(regex);
            if (matches) {
                let name = matches[1].split(' ')[0];
                let surname = matches[1].split(' ')[1];
                let number = matches[2];
                let year = matches[3];
                let time = matches[4];
                let item = data.find(item => {
                    let itemFullName = (capitalizeFirstLetter(item.Name) + ' ' + capitalizeFirstLetter(item.Surename)).trim().toLowerCase();
                    let itemYear = item.year;
                    let itemNameSurname = (name + ' ' + surname).trim().toLowerCase();
                    return itemFullName === itemNameSurname && itemYear.toString() === year;
                });
                if (item) {
                    if (e.target.checked) {
                        if (!colorMap[name + surname]) {
                            colorMap[name + surname] = getNextColor();
                        }
                        window.selectedItems.push(item);
                    } else {
                        let index = window.selectedItems.indexOf(item);
                        window.selectedItems.splice(index, 1);
                    }
                    // Always rebuild the chart from scratch when a checkbox is checked or unchecked
                    updateChart();
                }
            } else {
                console.error('Unexpected format for checkboxText:', checkboxText);
                return;
            }
        }
    }
});



