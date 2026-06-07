window.selectedItems = []; // Store chart selections only for the active competition.
window.activeSearchDataset = 'goniPony';

let data = [];
const currentYear = new Date().getFullYear();

// Load and tag every main Goni Pony result so chart selections can verify their source.
for (let year = 2015; year <= currentYear; year++) {
    fetch(`data/${year}/${year}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        })
        .then(yearData => {
            yearData.forEach(item => {
                item.year = year;
                item.competition = 'goniPony';
                item.Name = item.Name || 'Anonymous';
                item.Surename = item.Surename || 'Anonymous ';
            });

            data = data.concat(yearData);
        })
        .catch(error => {
            console.log(`Failed to load Goni Pony data for ${year}: ${error}`);
        });
}

// Clear result details left by another view.
function clearTimes() {
    const timesDiv = document.getElementById('times');
    if (timesDiv) {
        timesDiv.innerHTML = '';
    }
}

// Compare search words without case or accent sensitivity.
function stringsMatch(firstString, secondString) {
    return firstString.localeCompare(secondString, undefined, {
        sensitivity: 'base'
    }) === 0;
}

// Format imported uppercase participant names for display.
function titleCase(value) {
    return value.toLocaleLowerCase('sl-SI')
        .replace(/(^|\s|-)\p{L}/gu, letter => letter.toLocaleUpperCase('sl-SI'));
}

// Return only the dataset currently selected by the search switch.
async function getActiveSearchData() {
    if (window.activeSearchDataset === 'rogljicevKm') {
        return getRogljicevKmResults();
    }

    return data;
}

// Update the notice and switch label to clearly identify the active competition.
function updateSearchDatasetNotice() {
    const switchContainer = document.getElementById('search-data-switch');
    const notice = document.getElementById('search-data-notice');
    const toggleButton = document.getElementById('search-data-toggle');
    const isRogljicevKm = window.activeSearchDataset === 'rogljicevKm';

    notice.textContent = isRogljicevKm
        ? 'Search in the Rogljičev Kilometer results only.'
        : 'Search in the general Goni Pony results';
    switchContainer.classList.toggle('is-rogljicev-km', isRogljicevKm);
    switchContainer.classList.toggle('is-goni-pony', !isRogljicevKm);
    toggleButton.setAttribute('aria-checked', String(isRogljicevKm));
    toggleButton.setAttribute(
        'aria-label',
        isRogljicevKm
            ? 'Switch search to general Goni Pony results'
            : 'Switch search to Rogljičev Kilometer results'
    );
}

// Reveal the dataset control only after a search has been submitted.
function showSearchDatasetSwitch() {
    document.getElementById('search-data-switch').classList.add('is-visible');
}

// Clear search-specific UI when another page section is opened.
function resetSearchView() {
    window.activeSearchDataset = 'goniPony';
    document.getElementById('search-input').value = '';
    document.getElementById('results').innerHTML = '';
    document.getElementById('search-data-switch').classList.remove('is-visible');
    updateSearchDatasetNotice();
    clearChart();
}

// Switch competition data and clear selections so chart datasets can never mix.
function setSearchDataset(datasetName, rerunSearch = true) {
    if (!['goniPony', 'rogljicevKm'].includes(datasetName)) {
        return;
    }

    const datasetChanged = window.activeSearchDataset !== datasetName;
    window.activeSearchDataset = datasetName;
    updateSearchDatasetNotice();

    if (!datasetChanged) {
        return;
    }

    clearChart();
    document.getElementById('results').innerHTML = '';

    if (rerunSearch && document.getElementById('search-input').value.trim()) {
        search();
    }
}

// Calculate a participant's overall rank inside one isolated competition dataset.
function calculateOverallRank(item, rankingData) {
    const sortedCompetitors = rankingData
        .filter(result => result.Time && result.Time !== 'DNF')
        .sort((first, second) => timeToSeconds(first.Time) - timeToSeconds(second.Time));

    let rank = 0;
    let previousTime = '';

    for (const competitor of sortedCompetitors) {
        if (competitor.Time !== previousTime) {
            rank++;
        }

        if (
            competitor.Name === item.Name &&
            competitor.Surename === item.Surename &&
            competitor.Number === item.Number &&
            competitor.year === item.year
        ) {
            return rank;
        }

        previousTime = competitor.Time;
    }

    return 'Unranked';
}

// Search names and BIP numbers only in the active competition dataset.
async function search() {
    clearTimes();

    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim().toLocaleLowerCase('sl-SI');
    const resultsDiv = document.getElementById('results');

    if (!query) {
        resultsDiv.innerHTML = '';
        document.getElementById('search-data-switch').classList.remove('is-visible');
        clearChart();
        return;
    }

    showSearchDatasetSwitch();

    const requestedDataset = window.activeSearchDataset;
    const activeData = await getActiveSearchData();

    // Ignore an outdated async search if the user switched datasets while it loaded.
    if (requestedDataset !== window.activeSearchDataset) {
        return;
    }

    const queryWords = query.split(/\s+/);
    const results = activeData.filter(item => {
        const nameWords = String(item.Name).split(/\s+/);
        const surnameWords = String(item.Surename).split(/\s+/);
        const number = String(item.Number);

        return queryWords.every(word =>
            nameWords.some(name => stringsMatch(name, word)) ||
            surnameWords.some(surname => stringsMatch(surname, word)) ||
            number.includes(word)
        );
    });

    resultsDiv.innerHTML = '';

    results.forEach(item => {
        const rank = calculateOverallRank(item, activeData);
        const resultRow = document.createElement('p');
        const checkbox = document.createElement('input');

        checkbox.type = 'checkbox';
        checkbox.className = 'result-checkbox';
        checkbox.resultItem = item;
        checkbox.disabled = item.Time === 'DNF';
        resultRow.appendChild(checkbox);

        const completionText = item.Time === 'DNF'
            ? ' did not complete the '
            : ' completed the ';
        const competitionText = requestedDataset === 'rogljicevKm'
            ? ' Rogljičev Kilometer in '
            : ' Goni Pony race in ';

        resultRow.appendChild(document.createTextNode(
            `${titleCase(item.Name)} ${titleCase(item.Surename)} [${item.Number}]` +
            `${completionText}${item.year}${competitionText}${item.Time} Rank: ${rank}`
        ));
        resultsDiv.appendChild(resultRow);
    });
}

// Run search from the button and keyboard using the currently active dataset.
document.getElementById('search-button').addEventListener('click', search);
document.getElementById('search-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        search();
    }
});

// Toggle between isolated main-event and Rogljičev Kilometer search datasets.
document.getElementById('search-data-toggle').addEventListener('click', function() {
    const nextDataset = window.activeSearchDataset === 'goniPony'
        ? 'rogljicevKm'
        : 'goniPony';
    setSearchDataset(nextDataset);
});

// Display the initial general-results search notice.
updateSearchDatasetNotice();
