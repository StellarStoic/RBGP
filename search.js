window.selectedItems = []; // This line defines selectedItems as a global variable

let data = [];

// Get the current year
let currentYear = new Date().getFullYear();

// Load data from each year
for (let year = 2015; year <= currentYear; year++) {
    fetch(`data/${year}/${year}.json`)
        .then(response => response.json())
        .then(yearData => {
            // Add the year to each item
            yearData.forEach(item => {
                item.year = year; // Here is where we add the year to each item
                // If Name or Surename is missing, replace it with "Anonymous"
                item.Name = item.Name || 'Anonymous';
                item.Surename = item.Surename || 'Anonymous ';
            });

            data = data.concat(yearData);
        })
        .catch(error => {
            // If an error occurred (like the file doesn't exist), just ignore it and continue
            console.log(`Failed to load data for year ${year}: ${error} because the race Goni Pony didn't end yet`);
        });
}

function clearTimes() {
    let timesDiv = document.getElementById('times');
    if (timesDiv) {
        timesDiv.innerHTML = '';
    }
}

function stringsMatch(str1, str2) {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' }) === 0;
}


function titleCase(str) {
    return str.toLowerCase().split(' ').map(function(word) {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

function search() {
    clearTimes();
    let query = document.getElementById('search-input').value.toLowerCase();
    let queryWords = query.split(' '); // Split the query into separate words
    if (!query) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    // Filter the data to find matches for all words in the query
    let results = data.filter(item => {
        let nameWords = item.Name.split(' ');
        let surnameWords = item.Surename.split(' ');
        let number = item.Number.toString();
    
        // Check if all query words are in either the name, surname or number
        return queryWords.every(word => nameWords.some(name => stringsMatch(name, word)) ||
                                        surnameWords.some(surname => stringsMatch(surname, word)) ||
                                        number.includes(word));
    });

    // Clear previous results
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Display the results
    for (let i = 0; i < results.length; i++) {
        let item = results[i];
        let rank = calculateOverallRank(item); // Use the calculateOverallRank function to get the rank
        let p = document.createElement('p');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'result-checkbox'; // We'll use this class to select all result checkboxes later
        
        p.appendChild(checkbox);

        let raceCompletionStatus;
        if (item.Time === 'DNF') {
            raceCompletionStatus = ' did not complete the ';
        } else {
            raceCompletionStatus = ' completed the ';
        }
        
        p.appendChild(document.createTextNode( titleCase(item.Name) + ' ' + titleCase(item.Surename) + ' [' + item.Number + ']' + raceCompletionStatus + item.year + ' Goni Pony race in ' + item.Time + ' Rank: ' + rank));
        
        resultsDiv.appendChild(p);
    }
}

// Function to calculate the overall rank of a given item
function calculateOverallRank(item) {
    let sortedCompetitors = data.filter(i => i.Time !== "DNF").sort((a, b) => {
        let aTime = timeToSeconds(a.Time);
        let bTime = timeToSeconds(b.Time);
        return aTime - bTime; // Sort in ascending order
    });

    let rank = 1; // Starting rank
    let prevTime = '';

    for (let competitor of sortedCompetitors) {
        if (competitor.Time !== prevTime) {
            // If the time is not the same, set the rank to current index + 1
            rank++;
        }
        if (competitor.Name === item.Name && competitor.Surename === item.Surename && competitor.year === item.year) {
            return rank;
        }
        prevTime = competitor.Time; // update prevTime for the next iteration
    }
    return 'Unranked';
}
window.onload = function() {
    // Assuming that you have a button with id 'search-button'
    document.getElementById('search-button').addEventListener('click', search);

    // Handle 'Enter' key in the search field
    document.getElementById('search-input').addEventListener('keyup', function(event) {
        if (event.key === "Enter") {
            search();
        }
    });

    let selectAllCheckbox = document.getElementById('select-all');
    selectAllCheckbox.addEventListener('change', function(e) {
        let allCheckboxes = document.querySelectorAll('.result-checkbox');
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;

            // Update selectedItems
            let itemText = checkbox.parentElement.textContent.trim();
            if (checkbox.checked) {
                // If checkbox is checked and item is not already in selectedItems, add it
                if (!window.selectedItems.includes(itemText)) {
                    window.selectedItems.push(itemText);
                }
            } else {
                // If checkbox is not checked and item is in selectedItems, remove it
                let index = window.selectedItems.indexOf(itemText);
                if (index !== -1) {
                    window.selectedItems.splice(index, 1);
                }
            }
        });

        // Update the chart with the new selected items
        updateChart(window.selectedItems);
    });
}
