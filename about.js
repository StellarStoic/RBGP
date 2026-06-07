const aboutFirstResultsYear = 2015;

// Convert a valid race result into seconds for all-time comparison.
function aboutTimeToSeconds(time) {
    if (typeof time !== 'string' || !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Format imported uppercase names while preserving Slovenian characters.
function formatAboutName(name, surname) {
    return `${name || 'Anonymous'} ${surname || ''}`
        .trim()
        .toLocaleLowerCase('sl-SI')
        .replace(/(^|\s|-)\p{L}/gu, letter => letter.toLocaleUpperCase('sl-SI'));
}

// Load one event year and attach its year to every result.
async function loadAboutResultsYear(year) {
    try {
        const response = await fetch(`data/${year}/${year}.json`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return [];
        }

        const results = await response.json();
        return Array.isArray(results)
            ? results.map(result => ({
                ...result,
                year
            }))
            : [];
    } catch (error) {
        return [];
    }
}

// Find and display the fastest valid Goni Pony result across every available edition.
async function updateAboutAllTimeRecord() {
    const requests = [];
    const currentYear = new Date().getFullYear();

    for (let year = aboutFirstResultsYear; year <= currentYear; year++) {
        requests.push(loadAboutResultsYear(year));
    }

    const allResults = (await Promise.all(requests)).flat();
    const fastestResult = allResults.reduce((fastest, result) => {
        const seconds = aboutTimeToSeconds(result.Time);
        if (seconds === null || result.Time === 'DNF') {
            return fastest;
        }

        if (!fastest || seconds < fastest.seconds) {
            return {
                ...result,
                seconds
            };
        }

        return fastest;
    }, null);

    if (!fastestResult) {
        document.getElementById('about-record-time').textContent = 'not available';
        document.getElementById('about-record-holder').textContent = 'an unknown rider';
        document.getElementById('about-record-year').textContent = 'an unknown year';
        return;
    }

    document.getElementById('about-record-time').textContent = fastestResult.Time;
    document.getElementById('about-record-holder').textContent = formatAboutName(fastestResult.Name, fastestResult.Surename);
    document.getElementById('about-record-year').textContent = fastestResult.year;
}

// Populate the dynamic all-time record when the About page is ready.
document.addEventListener('DOMContentLoaded', updateAboutAllTimeRecord);
