function clearTimes() {
    let timesDiv = document.getElementById('times');
    if (timesDiv) {
        timesDiv.innerHTML = '';
    }
}

document.getElementById('top10').addEventListener('click', function() {
    clearTimes();
    showTop10ByYear();
});



// Convert only valid finish times so DNF and malformed results cannot enter Top10.
function top10TimeToSeconds(time) {
    if (typeof time !== 'string' || !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Sort complete yearly results with valid finishers first and every DNF entry last.
function getCompleteYearResults(yearResults) {
    return [...yearResults].sort((first, second) => {
        const firstTime = top10TimeToSeconds(first.Time);
        const secondTime = top10TimeToSeconds(second.Time);

        if (firstTime === null && secondTime === null) {
            return 0;
        }

        if (firstTime === null) {
            return 1;
        }

        if (secondTime === null) {
            return -1;
        }

        return firstTime - secondTime;
    });
}

// Build either the Top10 or complete yearly participant list.
function createYearResultList(results, showCompleteList) {
    const resultList = document.createElement('ul');
    resultList.className = showCompleteList ? 'top10-year-list is-expanded' : 'top10-year-list';

    let rank = 0;
    let previousTime = '';

    results.forEach((item, index) => {
        const validTime = top10TimeToSeconds(item.Time);
        const listItem = document.createElement('li');

        if (validTime === null) {
            listItem.textContent = `DNF. ${capitalizeFirstLetter(item.Name)} ${capitalizeFirstLetter(item.Surename)} [${item.Number}] (${item.Time || 'DNF'})`;
            listItem.classList.add('top10-dnf');
        } else {
            if (item.Time !== previousTime) {
                rank = showCompleteList ? index + 1 : rank + 1;
            }

            listItem.textContent = `${rank}. ${capitalizeFirstLetter(item.Name)} ${capitalizeFirstLetter(item.Surename)} [${item.Number}] (${item.Time})`;
            previousTime = item.Time;
        }

        resultList.appendChild(listItem);
    });

    return resultList;
}

// Replace a year's Top10 with its complete results, or collapse it back to Top10.
function toggleCompleteYearResults(yearSection, yearResults, top10Results) {
    const isExpanded = yearSection.classList.toggle('is-expanded');
    const currentList = yearSection.querySelector('.top10-year-list');
    const toggleIcon = yearSection.querySelector('.top10-toggle-icon');
    const yearHeading = yearSection.querySelector('.top10-year-heading');

    currentList.replaceWith(createYearResultList(
        isExpanded ? getCompleteYearResults(yearResults) : top10Results,
        isExpanded
    ));
    toggleIcon.textContent = isExpanded ? '−' : '+';
    yearHeading.setAttribute('aria-expanded', String(isExpanded));
}

function showTop10ByYear() {
    // Clear the chart first if there is any active
    clearChart(); 
    // First, let's group our data by year
    let groupedByYear = data.reduce((acc, curr) => {
        acc[curr.year] = [...(acc[curr.year] || []), curr];
        return acc;
    }, {});

    // For each year, completely exclude DNF/invalid results before sorting the fastest ten.
    let top10ByYear = Object.keys(groupedByYear).reduce((acc, year) => {
        let sortedCompetitors = groupedByYear[year]
            .filter(item => top10TimeToSeconds(item.Time) !== null)
            .sort((a, b) => top10TimeToSeconds(a.Time) - top10TimeToSeconds(b.Time))
            .slice(0, 10);

        acc[year] = sortedCompetitors;
        return acc;
    }, {});

    // Now, we can display the results
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    Object.keys(top10ByYear).sort((a, b) => a - b).forEach(year => { // Sort years in ascending order
        const yearSection = document.createElement('section');
        yearSection.className = 'top10-year-section';

        const yearHeading = document.createElement('h3');
        yearHeading.className = 'top10-year-heading';
        yearHeading.tabIndex = 0;
        yearHeading.setAttribute('role', 'button');
        yearHeading.setAttribute('aria-expanded', 'false');
        yearHeading.setAttribute('aria-label', `Show all ${year} participants`);

        const yearText = document.createElement('span');
        yearText.textContent = year;

        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'top10-toggle-icon';
        toggleIcon.textContent = '+';
        toggleIcon.setAttribute('aria-hidden', 'true');

        yearHeading.appendChild(yearText);
        yearHeading.appendChild(toggleIcon);
        yearSection.appendChild(yearHeading);
        yearSection.appendChild(createYearResultList(top10ByYear[year], false));

        // Expand or collapse the complete year when either the heading or icon is clicked.
        yearHeading.addEventListener('click', function() {
            toggleCompleteYearResults(yearSection, groupedByYear[year], top10ByYear[year]);
        });

        // Give keyboard users the same expand/collapse behavior as pointer users.
        yearHeading.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleCompleteYearResults(yearSection, groupedByYear[year], top10ByYear[year]);
            }
        });

        resultsDiv.appendChild(yearSection);
    });
}

window.addEventListener('scroll', function() {
    var scrollToTopButton = document.getElementById('scrollToTopButton');
    var scrollPercent = (document.documentElement.scrollTop + document.body.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight) * 100;
  
    if (scrollPercent > 20) {
      scrollToTopButton.style.display = 'block';
    } else {
      scrollToTopButton.style.display = 'none';
    }
  });
  
  document.getElementById('scrollToTopButton').addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

