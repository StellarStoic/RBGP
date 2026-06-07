const chartCanvas = document.getElementById('myChart');
const chartContext = chartCanvas.getContext('2d');
const chartContainer = document.getElementById('chart-container');
const chartCanvasWrap = document.querySelector('.chart-canvas-wrap');
const chartSnapshotButton = document.getElementById('chart-snapshot-button');

let myChart;
let colorIndex = 0;
let colorMap = {};

const colorPalette = [
    '#d7191c',
    '#2c7bb6',
    '#1a9641',
    '#f28e2b',
    '#7b3294',
    '#008080',
    '#e7298a',
    '#6b4c3b'
];

// Format seconds as race time without showing an unnecessary leading hour.
function secondsToRaceTime(totalSeconds) {
    const roundedSeconds = Math.round(Number(totalSeconds));
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Convert a valid HH:MM:SS result into seconds for Chart.js.
function timeToSeconds(time) {
    if (typeof time !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Preserve the shared name formatter used by the Top10 and Overall result views.
function capitalizeFirstLetter(string) {
    return string.charAt(0).toLocaleUpperCase('sl-SI') + string.slice(1).toLocaleLowerCase('sl-SI');
}

// Format imported uppercase names while preserving multi-word names and surnames.
function formatChartName(item) {
    return `${item.Name} ${item.Surename}`
        .toLocaleLowerCase('sl-SI')
        .replace(/(^|\s|-)\p{L}/gu, letter => letter.toLocaleUpperCase('sl-SI'));
}

// Create a stable key so every participant keeps the same line color.
function getParticipantKey(item) {
    return `${item.Name} ${item.Surename}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('sl-SI');
}

// Return the next high-contrast color used to distinguish participants.
function getNextColor() {
    const color = colorPalette[colorIndex];
    colorIndex = (colorIndex + 1) % colorPalette.length;
    return color;
}

// Create a filesystem-safe timestamp for the exported PNG filename.
function getSnapshotTimestamp() {
    const now = new Date();
    const date = [
        now.getFullYear(),
        (now.getMonth() + 1).toString().padStart(2, '0'),
        now.getDate().toString().padStart(2, '0')
    ].join('-');
    const time = [
        now.getHours().toString().padStart(2, '0'),
        now.getMinutes().toString().padStart(2, '0'),
        now.getSeconds().toString().padStart(2, '0')
    ].join('-');

    return `${date}_${time}`;
}

// Export the complete chart, including off-screen mobile content, on a solid PNG background.
function exportChartSnapshot() {
    if (!myChart) {
        return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width;
    exportCanvas.height = chartCanvas.height;

    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = '#ffffff';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(chartCanvas, 0, 0);

    // Convert the composed canvas to a PNG and trigger its browser download.
    exportCanvas.toBlob(blob => {
        if (!blob) {
            return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `goni_pony_${getSnapshotTimestamp()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        // Release the temporary object URL after the browser starts the download.
        window.setTimeout(() => {
            URL.revokeObjectURL(downloadUrl);
        }, 1000);
    }, 'image/png');
}

// Group selected race entries into one chronological line per participant.
function buildParticipantDatasets(selectedItems) {
    const datasetsByParticipant = new Map();

    selectedItems.forEach(item => {
        const timeInSeconds = timeToSeconds(item.Time);
        if (timeInSeconds === null) {
            return;
        }

        const participantKey = getParticipantKey(item);
        if (!colorMap[participantKey]) {
            colorMap[participantKey] = getNextColor();
        }

        if (!datasetsByParticipant.has(participantKey)) {
            datasetsByParticipant.set(participantKey, {
                label: formatChartName(item),
                data: [],
                borderColor: colorMap[participantKey],
                backgroundColor: colorMap[participantKey],
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointHitRadius: 16,
                tension: 0.18,
                spanGaps: true,
                fill: false
            });
        }

        // Keep the original result metadata on each point for reliable tooltips.
        datasetsByParticipant.get(participantKey).data.push({
            x: Number(item.year),
            y: timeInSeconds,
            result: item
        });
    });

    return Array.from(datasetsByParticipant.values()).map(dataset => {
        dataset.data.sort((first, second) => first.x - second.x);
        return dataset;
    });
}

// Remove the chart and reset all selected comparison results.
function clearChart() {
    if (myChart) {
        myChart.destroy();
        myChart = undefined;
    }

    chartContainer.classList.remove('is-visible');
    window.selectedItems = [];
    colorIndex = 0;
    colorMap = {};
}

// Render a mobile-friendly progression chart for the selected race results.
function updateChart() {
    if (myChart) {
        myChart.destroy();
        myChart = undefined;
    }

    const selectedItems = Array.isArray(window.selectedItems) ? window.selectedItems : [];
    const datasets = buildParticipantDatasets(selectedItems);

    if (datasets.length === 0) {
        chartContainer.classList.remove('is-visible');
        return;
    }

    const years = datasets.flatMap(dataset => dataset.data.map(point => point.x));
    const uniqueYears = [...new Set(years)].sort((first, second) => first - second);
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    // Give each event year enough horizontal room to remain readable on narrow screens.
    chartCanvasWrap.style.width = isMobile
        ? `${Math.max(640, uniqueYears.length * 90)}px`
        : '100%';

    chartContainer.classList.add('is-visible');

    myChart = new Chart(chartContext, {
        type: 'line',
        data: {
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            normalized: true,
            interaction: {
                mode: 'nearest',
                axis: 'xy',
                intersect: false
            },
            layout: {
                padding: isMobile ? 8 : 18
            },
            scales: {
                x: {
                    type: 'linear',
                    min: uniqueYears[0] - 0.25,
                    max: uniqueYears[uniqueYears.length - 1] + 0.25,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        autoSkip: false,
                        font: {
                            size: isMobile ? 12 : 14,
                            weight: 'bold'
                        },
                        callback(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Event year',
                        font: {
                            size: isMobile ? 13 : 15,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)'
                    }
                },
                y: {
                    reverse: true,
                    grace: '8%',
                    ticks: {
                        maxTicksLimit: isMobile ? 7 : 9,
                        font: {
                            size: isMobile ? 11 : 13
                        },
                        callback(value) {
                            return secondsToRaceTime(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Finish time (faster is higher)',
                        font: {
                            size: isMobile ? 13 : 15,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        boxWidth: isMobile ? 10 : 14,
                        padding: isMobile ? 10 : 18,
                        font: {
                            size: isMobile ? 11 : 13
                        }
                    }
                },
                tooltip: {
                    displayColors: true,
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title(tooltipItems) {
                            return `${tooltipItems[0].raw.x} Goni Pony`;
                        },
                        label(context) {
                            const result = context.raw.result;
                            return `${context.dataset.label}: ${result.Time} · BIP ${result.Number}`;
                        },
                        afterLabel(context) {
                            const result = context.raw.result;
                            return result.Place ? `Place: ${result.Place}` : '';
                        }
                    }
                }
            }
        }
    });
}

// Add or remove the exact result object attached to a search-result checkbox.
document.getElementById('results').addEventListener('change', event => {
    if (!event.target.classList.contains('result-checkbox')) {
        return;
    }

    const selectedResult = event.target.resultItem;
    if (!selectedResult || selectedResult.Time === 'DNF') {
        return;
    }

    if (event.target.checked) {
        if (!window.selectedItems.includes(selectedResult)) {
            window.selectedItems.push(selectedResult);
        }
    } else {
        window.selectedItems = window.selectedItems.filter(item => item !== selectedResult);
    }

    updateChart();
});

// Download the currently rendered participant comparison as a PNG image.
chartSnapshotButton.addEventListener('click', exportChartSnapshot);

// Rebuild the chart when its mobile or desktop layout breakpoint changes.
window.addEventListener('resize', () => {
    if (myChart) {
        updateChart();
    }
});
