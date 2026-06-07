const chartCanvas = document.getElementById('myChart');
const chartContext = chartCanvas.getContext('2d');
const chartContainer = document.getElementById('chart-container');
const chartCanvasWrap = document.querySelector('.chart-canvas-wrap');
const chartSnapshotButton = document.getElementById('chart-snapshot-button');
const chartTitle = document.getElementById('chart-title');

let myChart;
let colorIndex = 0;
let colorMap = {};
let bicycleSvgText = '';
let bicycleSvgIsLoaded = false;
let rogljicevKmBackgroundIsLoaded = false;

const bicycleMarkerCache = new Map();
const bicycleMarkerSize = 34;
const websiteFontFamily = "'Courier Prime', monospace";
const rogljicevKmBackgroundImage = new Image();

// Canvas text does not inherit CSS, so configure Chart.js to use the website font.
Chart.defaults.font.family = websiteFontFamily;

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

// Load the Rogljičev Kilometer map used as a washed-out chart background.
rogljicevKmBackgroundImage.onload = function() {
    rogljicevKmBackgroundIsLoaded = true;

    if (myChart && window.activeSearchDataset === 'rogljicevKm') {
        myChart.update('none');
    }
};
rogljicevKmBackgroundImage.src = 'pics/rogljicevKm.png';

// Draw a responsive washed-out map behind Rogljičev Kilometer chart content.
const rogljicevKmBackgroundPlugin = {
    id: 'rogljicevKmBackground',
    beforeDraw(chart) {
        const context = chart.ctx;
        const width = chart.width;
        const height = chart.height;

        // Give every exported chart a solid base instead of a transparent canvas.
        context.save();
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);

        if (
            window.activeSearchDataset !== 'rogljicevKm' ||
            !rogljicevKmBackgroundIsLoaded
        ) {
            context.restore();
            return;
        }

        // Use cover-style scaling so the map always fills the complete chart without distortion.
        const imageScale = Math.max(
            width / rogljicevKmBackgroundImage.naturalWidth,
            height / rogljicevKmBackgroundImage.naturalHeight
        );
        const imageWidth = rogljicevKmBackgroundImage.naturalWidth * imageScale;
        const imageHeight = rogljicevKmBackgroundImage.naturalHeight * imageScale;
        const imageX = (width - imageWidth) / 2;
        const imageY = (height - imageHeight) / 2;

        context.globalAlpha = 0.12;
        context.drawImage(
            rogljicevKmBackgroundImage,
            imageX,
            imageY,
            imageWidth,
            imageHeight
        );
        context.restore();
    }
};

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
    if (typeof time !== 'string' || !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
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

// Build the chart title with singular or plural participant wording.
function getChartTitle(participantCount) {
    const participantLabel = participantCount === 1 ? 'Participant' : 'Participants';
    const competitionName = window.activeSearchDataset === 'rogljicevKm'
        ? 'Rogljičev Kilometer'
        : 'RedBull Goni Pony';
    return `${competitionName} ${participantLabel} time comparison`;
}

// Load the Pony bicycle SVG once so chart markers can be recolored per participant.
fetch('pics/ponykoloSVG.svg')
    .then(response => response.ok ? response.text() : '')
    .then(svgText => {
        bicycleSvgText = svgText;
        bicycleSvgIsLoaded = Boolean(svgText);

        // Rebuild the chart when the icon becomes available after an early selection.
        if (bicycleSvgIsLoaded && myChart) {
            updateChart();
        }
    })
    .catch(() => {
        bicycleSvgText = '';
        bicycleSvgIsLoaded = false;
    });

// Create a participant-colored bicycle marker canvas for Chart.js point rendering.
function getBicycleMarker(color) {
    if (!bicycleSvgIsLoaded) {
        return 'circle';
    }

    if (bicycleMarkerCache.has(color)) {
        return bicycleMarkerCache.get(color);
    }

    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = bicycleMarkerSize;
    markerCanvas.height = bicycleMarkerSize;

    const markerContext = markerCanvas.getContext('2d');
    const bicycleImage = new Image();
    const coloredSvg = bicycleSvgText
        .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
        .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`);
    const svgBlob = new Blob([coloredSvg], {
        type: 'image/svg+xml'
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    bicycleImage.onload = function() {
        markerContext.clearRect(0, 0, bicycleMarkerSize, bicycleMarkerSize);
        markerContext.drawImage(bicycleImage, 0, 3, bicycleMarkerSize, bicycleMarkerSize * 0.74);
        URL.revokeObjectURL(svgUrl);

        // Ask Chart.js to redraw after the async image is painted onto the marker canvas.
        if (myChart) {
            myChart.update('none');
        }
    };

    bicycleImage.onerror = function() {
        URL.revokeObjectURL(svgUrl);
    };

    bicycleImage.src = svgUrl;
    bicycleMarkerCache.set(color, markerCanvas);
    return markerCanvas;
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

    const snapshotTitle = chartTitle.textContent;
    const titleHeight = 72;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width;
    exportCanvas.height = chartCanvas.height + titleHeight;

    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = '#ffffff';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw the dynamic title above the chart without including the snapshot button.
    exportContext.fillStyle = '#111111';
    exportContext.font = `bold 26px ${websiteFontFamily}`;
    exportContext.textAlign = 'center';
    exportContext.textBaseline = 'middle';
    exportContext.fillText(snapshotTitle, exportCanvas.width / 2, titleHeight / 2, exportCanvas.width - 40);
    exportContext.drawImage(chartCanvas, 0, titleHeight);

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
        dataset.pointRotation = dataset.data.map((point, index, points) => {
            if (index === 0) {
                return 0;
            }

            const previousPoint = points[index - 1];
            if (point.y < previousPoint.y) {
                return -18;
            }

            if (point.y > previousPoint.y) {
                return 18;
            }

            return 0;
        });
        dataset.pointStyle = getBicycleMarker(dataset.borderColor);
        dataset.pointRadius = bicycleSvgIsLoaded ? 13 : 6;
        dataset.pointHoverRadius = bicycleSvgIsLoaded ? 17 : 9;
        return dataset;
    });
}

// Return the complete competition year range for the chart axis.
function getChartYearRange(selectedYears) {
    const isRogljicevKm = window.activeSearchDataset === 'rogljicevKm';
    const firstYear = isRogljicevKm
        ? Math.min(...selectedYears)
        : greetingsConfig.firstResultsYear || Math.min(...selectedYears);
    const activeItems = isRogljicevKm
        ? window.rogljicevKmData || window.selectedItems
        : data;
    const loadedYears = Array.isArray(activeItems)
        ? activeItems.map(item => Number(item.year)).filter(Number.isFinite)
        : [];
    const lastYear = loadedYears.length > 0
        ? Math.max(...loadedYears)
        : Math.max(...selectedYears);

    return {
        firstYear,
        lastYear
    };
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
    const chartYearRange = getChartYearRange(uniqueYears);
    const displayedYearCount = chartYearRange.lastYear - chartYearRange.firstYear + 1;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    // Keep the page and exported image title in sync with the participant count.
    chartTitle.textContent = getChartTitle(datasets.length);

    // Give the complete competition year range enough room to remain readable on phones.
    chartCanvasWrap.style.width = isMobile
        ? `${Math.max(640, displayedYearCount * 90)}px`
        : '100%';

    chartContainer.classList.add('is-visible');

    myChart = new Chart(chartContext, {
        type: 'line',
        plugins: [
            rogljicevKmBackgroundPlugin
        ],
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
                    // Keep endpoint bicycles inside the canvas while labeling only whole event years.
                    min: chartYearRange.firstYear - 0.35,
                    max: chartYearRange.lastYear + 0.35,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        autoSkip: false,
                        font: {
                            family: websiteFontFamily,
                            size: isMobile ? 12 : 14,
                            weight: 'bold'
                        },
                        callback(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    afterBuildTicks(scale) {
                        // Keep whole-year endpoint labels while the scale retains bicycle padding.
                        scale.ticks = [];
                        for (let year = chartYearRange.firstYear; year <= chartYearRange.lastYear; year++) {
                            scale.ticks.push({
                                value: year
                            });
                        }
                    },
                    title: {
                        display: true,
                        text: 'Event year',
                        font: {
                            family: websiteFontFamily,
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
                            family: websiteFontFamily,
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
                            family: websiteFontFamily,
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
                        // Reserve enough width for the bicycle marker plus a small gap before the name.
                        boxWidth: 42,
                        pointStyleWidth: 36,
                        padding: isMobile ? 10 : 18,
                        font: {
                            family: websiteFontFamily,
                            size: isMobile ? 11 : 13
                        }
                    }
                },
                tooltip: {
                    displayColors: true,
                    padding: 12,
                    titleFont: {
                        family: websiteFontFamily,
                        size: 14
                    },
                    bodyFont: {
                        family: websiteFontFamily,
                        size: 13
                    },
                    callbacks: {
                        title(tooltipItems) {
                            const competitionName = window.activeSearchDataset === 'rogljicevKm'
                                ? 'Rogljičev Kilometer'
                                : 'Goni Pony';
                            return `${tooltipItems[0].raw.x} ${competitionName}`;
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

    // Reject stale checkboxes from another competition before they reach the chart.
    if (selectedResult.competition !== window.activeSearchDataset) {
        event.target.checked = false;
        clearChart();
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

// Redraw canvas text after Courier Prime finishes loading in the browser.
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        if (myChart) {
            updateChart();
        }
    });
}
