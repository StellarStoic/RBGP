function showAllOverall() {
    // Clear the chart first if there is any active
    clearChart(); 

    // Filter out those who did not finish and sort competitors by time 
    let sortedCompetitors = data.filter(item => item.Time !== "DNF").sort((a, b) => {
        let aTime = timeToSeconds(a.Time);
        let bTime = timeToSeconds(b.Time);
        return aTime - bTime; // Sort in ascending order
    });

    // Now, we can display the results
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    let h3 = document.createElement('h3');
    h3.textContent = "Overall ranking";
    resultsDiv.appendChild(h3);

    let ol = document.createElement('ul');
    let rank = 0; // Starting rank
    let prevTime = '';
    let results = []; // Array to hold top 101 ranks

    sortedCompetitors.forEach((item, index) => {
        if (item.Time !== prevTime) {
            // If the time is not the same, set the rank to current index + 1
            rank ++;
        }
        // Only add to results if rank is <= 101
    if (rank <= 101) {
        results.push(item);
    }
        let li = document.createElement('li');
        li.textContent = `${rank}. ${capitalizeFirstLetter(item.Name)} ${capitalizeFirstLetter(item.Surename)} [${item.Number}] - ${item.year}, Time: ${item.Time}`;
        ol.appendChild(li);
        prevTime = item.Time; // update prevTime for the next iteration
    });

    resultsDiv.appendChild(ol);
}

// Add event listener to the button to trigger the function
document.getElementById('all-overall').addEventListener('click', function() {
    clearTimes();
    showAllOverall();
});


