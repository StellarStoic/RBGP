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



function timeToSeconds(time) {
    if (!time) return;  // Add this to handle potential undefined times
    let parts = time.split(':');
    return parts[0] * 3600 + parts[1] * 60 + parseFloat(parts[2]);
}

function showTop10ByYear() {
    // Clear the chart first if there is any active
    clearChart(); 
    // First, let's group our data by year
    let groupedByYear = data.reduce((acc, curr) => {
        acc[curr.year] = [...(acc[curr.year] || []), curr];
        return acc;
    }, {});

    // Then, for each year, we'll sort the competitors by time and take the first 10
    let top10ByYear = Object.keys(groupedByYear).reduce((acc, year) => {
        let sortedCompetitors = [...groupedByYear[year]].sort((a, b) => {
            let aTime = timeToSeconds(a.Time);
            let bTime = timeToSeconds(b.Time);
            return aTime - bTime; // Sort in ascending order
        }).slice(0, 10); // Take the first 10

        acc[year] = sortedCompetitors;
        return acc;
    }, {});

    // Now, we can display the results
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    Object.keys(top10ByYear).sort((a, b) => a - b).forEach(year => { // Sort years in ascending order
        let h3 = document.createElement('h3');
        h3.textContent = year;
        resultsDiv.appendChild(h3);

        let ol = document.createElement('ul');
        top10ByYear[year].forEach((item, index) => {
            let li = document.createElement('li');
            li.textContent = `${index + 1}. ${capitalizeFirstLetter(item.Name)} ${capitalizeFirstLetter(item.Surename)} [${item.Number}] (${item.Time})`;
            ol.appendChild(li);
        });
        resultsDiv.appendChild(ol);
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

