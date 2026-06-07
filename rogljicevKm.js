const rogljicevKmFirstYear = 2026;
let rogljicevKmResultsPromise;

// Convert a Rogljičev Kilometer time into seconds for overall sorting.
function rogljicevKmTimeToSeconds(time) {
    if (typeof time !== 'string') {
        return Number.POSITIVE_INFINITY;
    }

    const timeParts = time.split(':').map(Number);
    if (timeParts.length !== 3 || timeParts.some(Number.isNaN)) {
        return Number.POSITIVE_INFINITY;
    }

    return (timeParts[0] * 3600) + (timeParts[1] * 60) + timeParts[2];
}

// Parse one CSV row while preserving quoted values and Slovenian characters.
function parseRogljicevKmCsvRow(row) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let index = 0; index < row.length; index++) {
        const character = row[index];

        if (character === '"') {
            if (insideQuotes && row[index + 1] === '"') {
                currentValue += '"';
                index++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (character === ',' && !insideQuotes) {
            values.push(currentValue);
            currentValue = '';
        } else {
            currentValue += character;
        }
    }

    values.push(currentValue);
    return values;
}

// Convert the current CSV fallback into the same objects expected from yearly JSON files.
function parseRogljicevKmCsv(csvText, year) {
    return csvText
        .split(/\r?\n/)
        .filter(row => row.trim())
        .map(row => {
            const [place, number, surname, name, time] = parseRogljicevKmCsvRow(row);
            return {
                Place: place,
                Number: number,
                Surename: surname,
                Name: name,
                Time: time,
                year,
                competition: 'rogljicevKm'
            };
        });
}

// Load one edition from JSON, falling back to the existing CSV when JSON is unavailable.
async function loadRogljicevKmYear(year) {
    const basePath = `data/rogljicevKm/${year}/rkm${year}`;

    try {
        const jsonResponse = await fetch(`${basePath}.json`, {
            cache: 'no-store'
        });

        if (jsonResponse.ok) {
            const results = await jsonResponse.json();
            return Array.isArray(results)
                ? results.map(result => ({
                    ...result,
                    year,
                    competition: 'rogljicevKm'
                }))
                : [];
        }
    } catch (error) {
        // Continue to the CSV fallback when the preferred JSON file is unavailable.
    }

    try {
        const csvResponse = await fetch(`${basePath}.csv`, {
            cache: 'no-store'
        });

        if (!csvResponse.ok) {
            return [];
        }

        return parseRogljicevKmCsv(await csvResponse.text(), year);
    } catch (error) {
        return [];
    }
}

// Load every Rogljičev Kilometer edition from its first year through the current year.
async function loadAllRogljicevKmResults() {
    const requests = [];
    const currentYear = new Date().getFullYear();

    for (let year = rogljicevKmFirstYear; year <= currentYear; year++) {
        requests.push(loadRogljicevKmYear(year));
    }

    return (await Promise.all(requests)).flat();
}

// Cache all Rogljičev Kilometer editions so ranking and search reuse one dataset.
function getRogljicevKmResults() {
    if (!rogljicevKmResultsPromise) {
        rogljicevKmResultsPromise = loadAllRogljicevKmResults().then(results => {
            window.rogljicevKmData = results;
            return results;
        });
    }

    return rogljicevKmResultsPromise;
}

// Display Rogljičev Kilometer competitors in the same overall ranking format as the main event.
async function showRogljicevKmOverall() {
    clearChart();
    clearTimes();

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const heading = document.createElement('h3');
    heading.textContent = 'Rogljičev Kilometer overall ranking';
    resultsDiv.appendChild(heading);

    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = 'Loading Rogljičev Kilometer results...';
    resultsDiv.appendChild(loadingMessage);

    const results = await getRogljicevKmResults();
    loadingMessage.remove();

    if (results.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = 'Rogljičev Kilometer results are not available yet.';
        resultsDiv.appendChild(noResultsMessage);
        return;
    }

    const sortedResults = results
        .filter(result => result.Time && result.Time !== 'DNF')
        .sort((first, second) => rogljicevKmTimeToSeconds(first.Time) - rogljicevKmTimeToSeconds(second.Time));

    const resultList = document.createElement('ul');
    let rank = 0;
    let previousTime = '';

    sortedResults.forEach(result => {
        if (result.Time !== previousTime) {
            rank++;
        }

        const listItem = document.createElement('li');
        listItem.textContent = `${rank}. ${capitalizeFirstLetter(result.Name)} ${capitalizeFirstLetter(result.Surename)} [${result.Number}] - ${result.year}, Time: ${result.Time}`;
        resultList.appendChild(listItem);
        previousTime = result.Time;
    });

    resultsDiv.appendChild(resultList);
}

// Open the Rogljičev Kilometer overall view when its navigation button is selected.
document.getElementById('rogljicev-km').addEventListener('click', function() {
    if (typeof setSearchDataset === 'function') {
        setSearchDataset('rogljicevKm', false);
    }

    showRogljicevKmOverall();
});
