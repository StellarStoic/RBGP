window.selectedItems = []; // Store chart selections only for the active competition.
window.activeSearchDataset = 'goniPony';

let data = [];
const currentYear = new Date().getFullYear();
const mainDataRequests = [];
let searchRequestId = 0;

// Load and tag every main Goni Pony result so chart selections can verify their source.
for (let year = 2015; year <= currentYear; year++) {
    // Keep each yearly request so searches can wait for the complete general dataset.
    const dataRequest = fetch(`data/${year}/${year}.json`)
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

    mainDataRequests.push(dataRequest);
}

// Resolve after every available yearly result file has loaded or been skipped.
const mainDataReady = Promise.all(mainDataRequests);

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

    // General searches need all available years before filtering participants.
    await mainDataReady;
    return data;
}

// Build an accessible loader with the Pony bicycle riding over animated waves.
function createSearchLoader() {
    const loader = document.createElement('div');
    loader.classList.add('search-loader');
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');

    const scene = document.createElement('div');
    scene.classList.add('search-loader-scene');
    scene.setAttribute('aria-hidden', 'true');

    const waves = document.createElement('div');
    waves.classList.add('search-loader-waves');

    const bicycle = document.createElement('img');
    bicycle.classList.add('search-loader-bicycle');
    bicycle.src = 'pics/ponykoloSVG.svg';
    bicycle.alt = '';

    // Choose a fresh bicycle color every time a search loader is created.
    const bicycleColors = [
        'azure',
        'dark-blue',
        'gold',
        'white',
        'black',
        'blue',
        'red',
        'green',
        'brown',
        'pink',
        'purple',
        'yellow',
        'orange'
    ];
    const randomColor = bicycleColors[
        Math.floor(Math.random() * bicycleColors.length)
    ];
    bicycle.classList.add(`search-loader-bicycle-${randomColor}`);

    const message = document.createElement('p');
    message.classList.add('search-loader-message');
    message.textContent = 'Searching results...';

    scene.appendChild(waves);
    scene.appendChild(bicycle);
    loader.appendChild(scene);
    loader.appendChild(message);

    return loader;
}

// Replace old results immediately with the current search loading state.
function showSearchLoader(resultsDiv) {
    resultsDiv.replaceChildren(createSearchLoader());
}

// Keep cached searches visible long enough for the loading animation to be perceived.
function waitForSearchLoader() {
    return new Promise(resolve => setTimeout(resolve, 300));
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
    // Invalidate pending searches so they cannot restore results after navigation.
    searchRequestId += 1;
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
    const currentRequestId = ++searchRequestId;

    if (!query) {
        resultsDiv.innerHTML = '';
        document.getElementById('search-data-switch').classList.remove('is-visible');
        clearChart();
        return;
    }

    showSearchDatasetSwitch();
    showSearchLoader(resultsDiv);

    const requestedDataset = window.activeSearchDataset;
    const [activeData] = await Promise.all([
        getActiveSearchData(),
        waitForSearchLoader()
    ]);

    // Ignore outdated searches after a dataset switch, newer search, or navigation.
    if (
        requestedDataset !== window.activeSearchDataset
        || currentRequestId !== searchRequestId
    ) {
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

    if (results.length === 0) {
        // Show a clear empty state after searching all available participant data.
        const noResults = document.createElement('p');
        noResults.classList.add('search-no-results');
        noResults.textContent = 'No results';
        resultsDiv.appendChild(noResults);
        return;
    }

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
