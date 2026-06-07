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

// Check whether a non-empty results file exists for the configured event year.
async function eventResultsAreAvailable(eventYear) {
    try {
        const response = await fetch(`data/${eventYear}/${eventYear}.json`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return false;
        }

        const eventResults = await response.json();
        return Array.isArray(eventResults) && eventResults.length > 0;
    } catch (error) {
        return false;
    }
}

// Show the correct finished-event message after checking for that year's result file.
async function showPostEventMessage(countdownText, eventYear) {
    countdownText.textContent = `Checking ${eventYear} results...`;
    const resultsAreAvailable = await eventResultsAreAvailable(eventYear);

    // Do not update home content that was removed while the results check was running.
    if (!countdownText.isConnected) {
        return;
    }

    if (resultsAreAvailable) {
        countdownText.textContent = `The ${eventYear} Goni Pony event has finished. ${greetingsConfig.resultsAvailableMessage}`;
        return;
    }

    countdownText.innerHTML = `The ${eventYear} Goni Pony event has finished. ${greetingsConfig.resultsPendingMessage} In the meantime, you can check <a href="${greetingsConfig.timingResultsUrl}" target="_blank" rel="noopener noreferrer">Timing Ljubljana</a> for the official results.`;
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
