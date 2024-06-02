let competitors = new Map();
let uniqueCompetitors = new Set();
let excludedTimes = new Map();

// If time is 'DNF' or null, return 9000
function getTimeInSeconds(time) {
    // If time is 'DNF' or null, return null
    if (time === 'DNF' || !time) {
        return null;
    }

    // If time is not in the format HH:MM:SS, return null
    let timeFormat = /^(\d{2}):(\d{2}):(\d{2})$/;
    if (!timeFormat.test(time)) {
        return null;
    }

    // Convert time string to seconds
    let timeParts = time.split(':');
    let timeInSeconds = (+timeParts[0]) * 60 * 60 + (+timeParts[1]) * 60 + (+timeParts[2]);

    return timeInSeconds;
}

function reorderList() {
    let ol = document.querySelector('#results ol');
    let lineIndex = Array.from(ol.children).findIndex(child => child.tagName === 'HR'); // Finding the index of HR line
    let elementsAboveLine = Array.from(ol.children).slice(0, lineIndex); // All elements above the line
    let elementsBelowLine = Array.from(ol.children).slice(lineIndex + 1); // All elements below the line

    // Sort the elements above and below the line individually
    let sortedAboveLine = elementsAboveLine.sort((a, b) => 
            getTimeInSeconds(a.textContent.split('with total time: ')[1]) - 
            getTimeInSeconds(b.textContent.split('with total time: ')[1])
        );

    let sortedBelowLine = elementsBelowLine.sort((a, b) => 
            getTimeInSeconds(a.textContent.split('with total time: ')[1]) - 
            getTimeInSeconds(b.textContent.split('with total time: ')[1])
        );
        
    // Clear the ol
    ol.innerHTML = '';

    // Append the sorted elements and the line back to the ol
    sortedAboveLine.forEach(li => ol.appendChild(li));
    ol.appendChild(document.createElement('hr')); // Adding back the line
    sortedBelowLine.forEach(li => ol.appendChild(li));
}


function recalculateTotalTime(competitor, excludedYear, excludedIndex) {
    let compData = competitors.get(competitor);
    compData.totalDuration = 0;
    let excluded = excludedTimes.get(competitor) || [];
    compData.years.forEach(yearObj => {
        yearObj.entries.forEach((item, index) => {
            if (excluded.some(ex => ex.year === yearObj.year && ex.index === index)) {
                return;
            }
            let timeInSeconds = getTimeInSeconds(item.Time);
            if (!timeInSeconds) return;
            compData.totalDuration += timeInSeconds;
        });
    });
    let li = document.querySelector(`#results li[data-competitor="${competitor}"]`);
    let hours = Math.floor(compData.totalDuration / 3600);
    let minutes = Math.floor((compData.totalDuration - (hours * 3600)) / 60);
    let seconds = compData.totalDuration - (hours * 3600) - (minutes * 60);
    let totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    li.textContent = `${compData.displayName} total time after editing is: ${totalTime}${compData.hasDuplicateEntries ? ' ***' : ''}`;
        reorderList();
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("all-years-button").addEventListener("click", function() {
        window.clearChart();
        processCompetitors();
    });
});


// I think this un-commenting thing is not needed anymore?
// uncomment and use this function when we have the results for the current year
// function processCompetitors() {
//     competitors = new Map(); // Clear the competitors map
//     uniqueCompetitors = new Set(); // Clear unique competitors set
//     excludedTimes = new Map(); // Clear excluded times

//     let allYears = [];
//     for (let year = 2015; year <= currentYear; year++) {
//         allYears.push(year);
//     }
//     competitors.forEach((compData, competitor) => {
//         recalculateTotalTime(competitor);
//     });

// I think this un-commenting thing is not needed anymore?
// uncomment this function bellow when new year starts and we don't have the results for the current year yet
// Or try to use manual steps in the instructions next to lastYearWithData variable 
// And don't forget to change textContent currentYear - 1 to only CurrentYear after the race
function processCompetitors() {
    competitors = new Map(); // Clear the competitors map
    uniqueCompetitors = new Set(); // Clear unique competitors set
    excludedTimes = new Map(); // Clear excluded times

    let currentYear = new Date().getFullYear();
    let lastYearWithData = currentYear - 1; // Manually set this to currentYear - 1 if current year's data is not available yet

    // Example: If the current year is 2024 and its data is not available, set lastYearWithData = 2023
    lastYearWithData = 2023;

    let allYears = [];
    for (let year = 2015; year <= lastYearWithData; year++) {
        allYears.push(year);
    }




    // Your existing code for processing competitors
    competitors.forEach((compData, competitor) => {
        recalculateTotalTime(competitor);
    });

    function formatName(name) {
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    data.forEach(item => {
        if (!isUniqueCompetitor(item)) return;
        let competitor = (item.Name.normalize('NFD').replace(/[\u0300-\u036f]/g, "") + ' ' + item.Surename.normalize('NFD').replace(/[\u0300-\u036f]/g, "")).toLowerCase();
        if (!competitors.has(competitor)) {
            competitors.set(competitor, { years: [], totalDuration: 0, dnfYears: [], displayName: formatName(item.Name) + ' ' + formatName(item.Surename), hasDuplicateEntries: false });  // NEW
        }
        let compData = competitors.get(competitor);
        let yearIndex = compData.years.findIndex(year => year.year === item.year);
        if (yearIndex === -1) {
            compData.years.push({ year: item.year, entries: [item] });
        } else {
            compData.years[yearIndex].entries.push(item);
            compData.hasDuplicateEntries = true; // NEW
        }
    });

    

    function displayCompetitorTimes(competitor) {
        let compData = competitors.get(competitor);
        let years = compData.years;
    
        // Sort years in descending order
        years.sort((a, b) => b.year - a.year);
    
        // Get the timesDiv inside modal-content
        let timesDiv = document.querySelector('#myModal .modal-content #times');
        if (!timesDiv) {
            timesDiv = document.createElement('div');
            timesDiv.id = 'times';
            document.querySelector('#myModal .modal-content').appendChild(timesDiv);
        }
        timesDiv.innerHTML = '';
    
        let h2 = document.createElement('h2');
        h2.textContent = `Times for ${compData.displayName}:`;
        timesDiv.appendChild(h2);
    
        years.forEach(yearObj => {
            let year = yearObj.year;
            let duplicate = yearObj.entries.length > 1;  // Check if there are duplicate entries for this year
            yearObj.entries.forEach((item, index) => {
                let time = compData.dnfYears.includes(year) ? 'DNF' : item.Time;
                if (time) {
                    let p = document.createElement('p');
                    p.textContent = `Year: ${year}, BIP: [${item.Number}], Time: ${time}`;
                    if (duplicate) {
                        p.style.backgroundColor = '#f09f10';  // Change background color if duplicate entries
                        p.textContent += ` - Select result from ${year} that is NOT yours ${compData.displayName}`;
                    }
                    timesDiv.appendChild(p);
                    if (yearObj.entries.length > 1) {
                        let checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.name = `exclude-${competitor}-${year}`;
                        checkbox.addEventListener('change', function() {
                            if (this.checked && yearObj.entries.length > 1) {
                                alert('If you want to make permanent changes to your time please contact us at info@jeba.si');
                            }
                            let checkboxes = document.getElementsByName(this.name);
                            for (let i = 0; i < checkboxes.length; i++) {
                                let associatedP = checkboxes[i].parentNode;
                                if (checkboxes[i] === this) {
                                    if (this.checked) {
                                        associatedP.classList.add('strikethrough');
                                        let timeInSeconds = getTimeInSeconds(time);
                                        if (!timeInSeconds) {
                                            return;
                                        }
                                        if (!excludedTimes.has(competitor)) {
                                            excludedTimes.set(competitor, []);
                                        }
                                        let timeIndex = excludedTimes.get(competitor).findIndex(excludedTime => excludedTime.year === year && excludedTime.index === index);
                                        if (timeIndex !== -1) {
                                            compData.totalDuration -= excludedTimes.get(competitor)[timeIndex].timeInSeconds;
                                        }
                                        excludedTimes.get(competitor).push({ year, index, timeInSeconds });
                                    } else {
                                        associatedP.classList.remove('strikethrough');
                                        let timeIndex = excludedTimes.get(competitor).findIndex(excludedTime => excludedTime.year === year && excludedTime.index === index);
                                        if (timeIndex !== -1) {
                                            compData.totalDuration += excludedTimes.get(competitor)[timeIndex].timeInSeconds;
                                            excludedTimes.get(competitor).splice(timeIndex, 1);
                                        }
                                    }
                                } else if (!checkboxes[i].checked) {
                                    associatedP.classList.remove('strikethrough');
                                }
                            }
                            recalculateTotalTime(competitor);
                        });
                        p.appendChild(checkbox);
                    }
                }
            });
        });
    
        // Get the modal
        let modal = document.getElementById('myModal');
    
        // Get the <span> element that closes the modal
        let span = document.getElementsByClassName("close")[0];
    
        // Open the modal 
        modal.style.display = "block";
    
        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        }
    
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

    function clearTimes() {
        let timesDiv = document.getElementById('times');
        if (timesDiv) {
            timesDiv.innerHTML = '';
        }
    }
    
    function isUniqueCompetitor(item) {
        let competitorId = `${item.Name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")} ${item.Surename.normalize('NFD').replace(/[\u0300-\u036f]/g, "")} ${item.Number}`;
        if (uniqueCompetitors.has(competitorId)) {
            return false;
        } else {
            uniqueCompetitors.add(competitorId);
            return true;
        }
    }

    data.forEach(item => {
        if (!isUniqueCompetitor(item)) return;
        let competitor = (item.Name.normalize('NFD').replace(/[\u0300-\u036f]/g, "") + ' ' + item.Surename.normalize('NFD').replace(/[\u0300-\u036f]/g, "")).toLowerCase();
        if (!competitors.has(competitor)) {
            competitors.set(competitor, { years: [], totalDuration: 0, dnfYears: [], displayName: formatName(item.Name) + ' ' + formatName(item.Surename) });
        }
        let compData = competitors.get(competitor);
        let yearIndex = compData.years.findIndex(year => year.year === item.year);
        if (yearIndex === -1) {
            compData.years.push({ year: item.year, entries: [item] });
        } else {
            compData.years[yearIndex].entries.push(item);
        }
    });
    
    competitors.forEach((compData, competitor) => {
        compData.years.forEach(yearObj => {
            let yearTimeInSeconds = 0;
            let hasValidTimeEntry = false;  // Flag to indicate if a valid time entry exists for this year
            yearObj.entries.forEach((entry, index) => {
                let timeInSeconds = getTimeInSeconds(entry.Time);
                if(timeInSeconds !== null) {
                    yearTimeInSeconds += timeInSeconds;
                    hasValidTimeEntry = true;  // If a valid time entry exists, set flag to true
                }
            });
            if (yearObj.entries.every(entry => entry.Time === 'DNF') && !hasValidTimeEntry) {
                compData.dnfYears.push(yearObj.year);
            } else {
                compData.totalDuration += yearTimeInSeconds;
            }
        });
    });
    
    let allYearsCompetitors = Array.from(competitors.entries()).filter(([competitor, compData]) => {
        // Exclude competitors with a 'DNF' entry in any year and no valid time entry in that year
        if (compData.dnfYears.length > 0) {
            return false;
        }
        return allYears.every(year => compData.years.some(yearObj => yearObj.year === year));
    });
    

    // sort the competitors, putting those with duplicate entries at the end
    allYearsCompetitors.sort((a, b) => {
        if (a[1].hasDuplicateEntries && !b[1].hasDuplicateEntries) return 1;
        if (!a[1].hasDuplicateEntries && b[1].hasDuplicateEntries) return -1;
        return a[1].totalDuration - b[1].totalDuration;
    });

    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    let ol = document.createElement('ol');
    let lastHadDuplicateEntries = false;
    allYearsCompetitors.forEach(([competitor, compData]) => {
        // if the current competitor has duplicate entries and the last one did not, insert a horizontal line
        if (compData.hasDuplicateEntries && !lastHadDuplicateEntries) {
            let hr = document.createElement('hr');
            ol.appendChild(hr);
        }
        
        let li = document.createElement('li');
        li.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f58231';
        });
        li.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        li.dataset.competitor = competitor;
        let hours = Math.floor(compData.totalDuration / 3600);
        let minutes = Math.floor((compData.totalDuration - (hours * 3600)) / 60);
        let seconds = compData.totalDuration - (hours * 3600) - (minutes * 60);
        let totalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
        let duplicate = compData.years.some(yearObj => yearObj.entries.length > 1);  // Check if any year has duplicate entries
        let textContent = duplicate ? 
        // if we have the results for current year use lines with currentYear
        // if we don'ts have the results for current year yet use lines with currentYear -1
        `*** Did ${compData.displayName} finished all RBGP editions from 2015 to ${currentYear} with a total time of ${totalTime} ?` :
        `${compData.displayName} finished all RBGP editions from 2015 to ${currentYear} with a total time of ${totalTime}`;
        // `*** Did ${compData.displayName} finished all RBGP editions from 2015 to ${currentYear -1} with a total time of ${totalTime} ?` :
        // `${compData.displayName} finished all RBGP editions from 2015 to ${currentYear -1} with a total time of ${totalTime}`;
        
        li.textContent = textContent;
        li.addEventListener('click', function() {
            displayCompetitorTimes(competitor);
        });
        ol.appendChild(li);
    
        // update lastHadDuplicateEntries for the next iteration
        lastHadDuplicateEntries = compData.hasDuplicateEntries;
    });
    resultsDiv.appendChild(ol);


    // ol.style.cursor = 'pointer';
    resultsDiv.appendChild(ol);
    let footnote = document.createElement('p');
    footnote.textContent = "*** Needs tweaking";
    resultsDiv.appendChild(footnote);
}

