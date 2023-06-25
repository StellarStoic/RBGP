function hideHomeGreeting() {
    let homeContainer = document.querySelector('.home-container');
    if (homeContainer) {
        homeContainer.parentNode.removeChild(homeContainer);
    }
}

function loadHomePage() {
    // Hide the previously opened data
    document.getElementById('results').innerHTML = '';
    document.getElementById('times').innerHTML = '';
  
    let homeContainer = document.querySelector('.home-container');
    if (!homeContainer) {
      homeContainer = document.createElement('div');
      homeContainer.classList.add('home-container');
  
      let homeText = document.createElement('p');
      homeText.classList.add('home-greeting');
      homeText.textContent = 'Greetings, Pony fans!';
  
      // Append the home greeting inside the container
      homeContainer.appendChild(homeText);
  
      // Insert the home container after the button container
      let buttonContainer = document.querySelector('.button-container');
      buttonContainer.parentNode.insertBefore(homeContainer, buttonContainer.nextSibling);
    }
  }

// Call the function once the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadHomePage();
});

// Also call the function when the home button is clicked
document.getElementById('home-btn').addEventListener('click', function() {
    hideHomeGreeting();
    loadHomePage();
});

// Add event listeners to other buttons
document.getElementById('all-years-button').addEventListener('click', function() {
    hideHomeGreeting();
    // Call the function or perform the logic for the "Veterans" button
});

document.getElementById('top10').addEventListener('click', function() {
    hideHomeGreeting();
    // Call the function or perform the logic for the "Top 10 each year" button
});

document.getElementById('all-overall').addEventListener('click', function() {
    hideHomeGreeting();
    // Call the function or perform the logic for the "Overall ranking" button
});

// Add event listener to the search button
document.getElementById('search-button').addEventListener('click', function() {
    hideHomeGreeting();
    // Call the search function or perform the logic for the search button
});

// Handle 'Enter' key in the search field
document.getElementById('search-input').addEventListener('keyup', function(event) {
    if (event.key === "Enter") {
        hideHomeGreeting();
        // Call the search function or perform the logic for the Enter key
    }
});


