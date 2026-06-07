let countdownInterval;

// Remove the home content and stop its timer when another section is opened.
function hideHomeGreeting() {
    clearInterval(countdownInterval);
    countdownInterval = undefined;

    const homeContainer = document.querySelector('.home-container');
    if (homeContainer) {
        homeContainer.remove();
    }
}

// Format the remaining event time for the live countdown.
function getCountdownParts(timeDifference) {
    return {
        days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((timeDifference / (1000 * 60)) % 60),
        seconds: Math.floor((timeDifference / 1000) % 60)
    };
}

// Load one result year and return an empty list when its file is missing or invalid.
async function loadEventResults(eventYear) {
    try {
        const response = await fetch(`data/${eventYear}/${eventYear}.json`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return [];
        }

        const eventResults = await response.json();
        return Array.isArray(eventResults) ? eventResults : [];
    } catch (error) {
        return [];
    }
}

// Convert a result time into seconds so records from different years can be compared.
function resultTimeToSeconds(time) {
    if (typeof time !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Find the fastest competitor among all valid result entries.
function findFastestResult(results) {
    return results.reduce((fastest, result) => {
        const timeInSeconds = resultTimeToSeconds(result.Time);
        if (timeInSeconds === null) {
            return fastest;
        }

        if (!fastest || timeInSeconds < fastest.timeInSeconds) {
            return {
                ...result,
                timeInSeconds
            };
        }

        return fastest;
    }, null);
}

// Format an imported uppercase competitor name for the home-page announcement.
function formatCompetitorName(result) {
    const fullName = `${result.Name || 'Anonymous'} ${result.Surename || ''}`.trim();
    return fullName.toLocaleLowerCase('sl-SI').replace(/(^|\s|-)\p{L}/gu, letter => letter.toLocaleUpperCase('sl-SI'));
}

// Format a record difference using only the minutes and seconds that are needed.
function formatTimeDifference(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }

    return `${minutes} minute${minutes === 1 ? '' : 's'} and ${seconds} second${seconds === 1 ? '' : 's'}`;
}

// Launch a short confetti celebration once per session for a newly beaten record.
function celebrateNewRecordOnce(eventYear, recordTime) {
    const celebrationKey = `rbgp-record-celebrated-${eventYear}-${recordTime}`;

    try {
        if (sessionStorage.getItem(celebrationKey)) {
            return;
        }

        // Mark the celebration before starting it so reopening Home cannot trigger it again.
        sessionStorage.setItem(celebrationKey, 'true');
    } catch (error) {
        // Continue without session tracking when browser privacy settings block sessionStorage.
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'record-confetti';
    confettiContainer.setAttribute('aria-hidden', 'true');

    const colors = ['#e6194b', '#f58231', '#ffe119', '#3cb44b', '#0082c8', '#911eb4', '#ffffff'];

    // Create varied pieces whose positions and animation delays produce the celebration effect.
    for (let index = 0; index < 90; index++) {
        const confettiPiece = document.createElement('span');
        confettiPiece.className = 'record-confetti-piece';
        confettiPiece.style.left = `${Math.random() * 100}%`;
        confettiPiece.style.backgroundColor = colors[index % colors.length];
        confettiPiece.style.animationDelay = `${Math.random() * 0.8}s`;
        confettiPiece.style.animationDuration = `${2.6 + Math.random() * 1.8}s`;
        confettiPiece.style.setProperty('--confetti-drift', `${Math.round((Math.random() - 0.5) * 260)}px`);
        confettiPiece.style.setProperty('--confetti-rotation', `${Math.round(540 + Math.random() * 720)}deg`);
        confettiContainer.appendChild(confettiPiece);
    }

    document.body.appendChild(confettiContainer);

    // Remove the animation elements after every piece has finished falling.
    window.setTimeout(() => {
        confettiContainer.remove();
    }, 5500);
}

// Load every earlier result year and return the fastest historical result.
async function findPreviousRecord(eventYear) {
    const resultRequests = [];

    for (let year = greetingsConfig.firstResultsYear; year < eventYear; year++) {
        resultRequests.push(loadEventResults(year));
    }

    const historicalResults = (await Promise.all(resultRequests)).flat();
    return findFastestResult(historicalResults);
}

// Build the record message for a new record, tied record, or slower winning time.
function getRecordAnnouncement(eventYear, currentFastest, previousRecord) {
    const competitorName = formatCompetitorName(currentFastest);

    if (!previousRecord) {
        return `The ${eventYear} results are in, and ${competitorName} set the first recorded fastest time.<span class="record-time">FASTEST TIME: ${currentFastest.Time}</span>`;
    }

    const difference = Math.abs(currentFastest.timeInSeconds - previousRecord.timeInSeconds);
    const formattedDifference = formatTimeDifference(difference);

    if (currentFastest.timeInSeconds < previousRecord.timeInSeconds) {
        return `The previous fastest time of ${previousRecord.Time} was beaten by ${formattedDifference} by ${competitorName}.<span class="record-time">NEW RECORD: ${currentFastest.Time}</span>`;
    }

    if (currentFastest.timeInSeconds === previousRecord.timeInSeconds) {
        return `The ${eventYear} results are in, and ${competitorName} matched the record of ${previousRecord.Time}.<span class="record-time">RECORD MATCHED: ${currentFastest.Time}</span>`;
    }

    return `The ${eventYear} results are in, and ${competitorName} reached ${greetingsConfig.courseName} in ${currentFastest.Time}, which was ${formattedDifference} slower than the record of ${previousRecord.Time}.`;
}

// Show the correct finished-event message after comparing current and historical results.
async function showPostEventMessage(countdownText, eventYear) {
    countdownText.textContent = `Checking ${eventYear} results...`;
    const currentResults = await loadEventResults(eventYear);

    // Do not update home content that was removed while the results check was running.
    if (!countdownText.isConnected) {
        return;
    }

    if (currentResults.length > 0) {
        const currentFastest = findFastestResult(currentResults);
        const previousRecord = await findPreviousRecord(eventYear);

        // Do not update home content that was removed while historical results were loading.
        if (!countdownText.isConnected) {
            return;
        }

        if (currentFastest) {
            countdownText.innerHTML = `${getRecordAnnouncement(eventYear, currentFastest, previousRecord)}<br><br>${greetingsConfig.resultsAvailableMessage} ${greetingsConfig.nextEventPendingMessage}`;

            // Celebrate only when this event's fastest result actually beats the previous record.
            if (previousRecord && currentFastest.timeInSeconds < previousRecord.timeInSeconds) {
                celebrateNewRecordOnce(eventYear, currentFastest.Time);
            }
        } else {
            countdownText.textContent = `The ${eventYear} Goni Pony event has finished. ${greetingsConfig.resultsAvailableMessage} ${greetingsConfig.nextEventPendingMessage}`;
        }
        return;
    }

    countdownText.innerHTML = `The ${eventYear} Goni Pony event has finished. ${greetingsConfig.resultsPendingMessage} In the meantime, you can check <a href="${greetingsConfig.timingResultsUrl}" target="_blank" rel="noopener noreferrer">Timing Ljubljana</a> for the official results.<br><br>${greetingsConfig.nextEventPendingMessage}`;
}

// Show either the detailed live countdown or the automatic post-event results message.
function updateEventMessage(countdownText, eventDate) {
    const timeDifference = eventDate.getTime() - Date.now();

    if (timeDifference <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = undefined;
        showPostEventMessage(countdownText, eventDate.getFullYear());
        return;
    }

    const remaining = getCountdownParts(timeDifference);
    const formattedEventDate = eventDate.toLocaleString('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    countdownText.innerHTML = `Listen up, pedal-pushers! ${greetingsConfig.eventName} is making its return in exactly:<br><br><strong>${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, and ${remaining.seconds} seconds</strong><br><br>We will be riding vintage bikes up <a href="${greetingsConfig.courseUrl}" target="_blank" rel="noopener noreferrer">${greetingsConfig.courseName}</a>: ${greetingsConfig.courseDescription}, on bikes with no gears.<br><br>No gear, no fear! <a href="${greetingsConfig.registrationUrl}" target="_blank" rel="noopener noreferrer">Event and registration information</a>.<br>See you in ${greetingsConfig.eventLocation} on <strong>${formattedEventDate}</strong>.`;
}

// Build the home section and start a timer only while the configured event is in the future.
function loadHomePage() {
    document.getElementById('results').innerHTML = '';
    document.getElementById('times').innerHTML = '';

    let homeContainer = document.querySelector('.home-container');
    if (homeContainer) {
        return;
    }

    homeContainer = document.createElement('div');
    homeContainer.classList.add('home-container');

    const homeText = document.createElement('p');
    homeText.classList.add('home-greeting');
    homeText.textContent = greetingsConfig.greeting;

    const countdownText = document.createElement('p');
    countdownText.classList.add('countdown');

    const eventDate = new Date(greetingsConfig.eventDate);
    if (Number.isNaN(eventDate.getTime())) {
        countdownText.textContent = 'The event date is not configured correctly.';
    } else {
        updateEventMessage(countdownText, eventDate);

        if (eventDate.getTime() > Date.now()) {
            countdownInterval = setInterval(() => {
                updateEventMessage(countdownText, eventDate);
            }, 1000);
        }
    }

    homeContainer.appendChild(homeText);
    homeContainer.appendChild(countdownText);

    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.parentNode.insertBefore(homeContainer, buttonContainer.nextSibling);
}

// Load the home section when the initial page markup is ready.
document.addEventListener('DOMContentLoaded', function() {
    loadHomePage();
});

// Recreate the home section and its countdown when the Home button is clicked.
document.getElementById('home-btn').addEventListener('click', function() {
    hideHomeGreeting();
    loadHomePage();
});

// Hide the home section when the Veterans section is opened.
document.getElementById('all-years-button').addEventListener('click', function() {
    hideHomeGreeting();
});

// Hide the home section when the Top 10 section is opened.
document.getElementById('top10').addEventListener('click', function() {
    hideHomeGreeting();
});

// Hide the home section when the Overall section is opened.
document.getElementById('all-overall').addEventListener('click', function() {
    hideHomeGreeting();
});

// Hide the home section when a search is started.
document.getElementById('search-button').addEventListener('click', function() {
    hideHomeGreeting();
});

// Hide the home section when Enter submits the search field.
document.getElementById('search-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        hideHomeGreeting();
    }
});
