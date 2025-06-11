function hideHomeGreeting() {
    let homeContainer = document.querySelector('.home-container');
    if (homeContainer) {
        homeContainer.parentNode.removeChild(homeContainer);
    }
}

//  this loadHomePage is for when we don't know the official date of the RBGP. (set the possible date bellow) Comment out the function and uncomment the function bellow this function for when the official date is known 
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
  
      let countdownText = document.createElement('p');
      countdownText.classList.add('countdown');
      const nextEventDate = new Date("2026-06-01"); // Set the date of the next event here
      const currentDate = new Date();
      const timeDifference = nextEventDate.getTime() - currentDate.getTime();
      const weeksUntilNextEvent = Math.ceil(timeDifference / (1000 * 3600 * 24 * 7));
      countdownText.innerHTML = `Listen up, pedal-pushers! The Redbull Goni Pony might be making its triumphant return in about <strong>${weeksUntilNextEvent} weeks</strong>.<br> So mark your calendars, or better yet, just keep them clear until we say otherwise! We'll drop the official date as soon as we get the green light. Or, you know, when one of you lovely folks spill the beans in the chat.<br> Stay tuned, keep those wheels oiled, and remember - no gear, no fear!`;
  
      // Append the home greeting and countdown text inside the container
      homeContainer.appendChild(homeText);
      homeContainer.appendChild(countdownText);
  
      // Insert the home container after the button container
      let buttonContainer = document.querySelector('.button-container');
      buttonContainer.parentNode.insertBefore(homeContainer, buttonContainer.nextSibling);
    }
  }



//   // this loadHomePage is for when WE KNOW the official date of the RBGP. correct the date, register URL, time and Comment out the function above
//   function loadHomePage() {
//     // Clear any previously displayed data
//     document.getElementById('results').innerHTML = '';
//     document.getElementById('times').innerHTML = '';
  
//     // Select the container for the home page content
//     let homeContainer = document.querySelector('.home-container');
//     if (!homeContainer) {
//         // Create the container if it doesn't exist
//         homeContainer = document.createElement('div');
//         homeContainer.classList.add('home-container');
  
//         // Create and add the greeting text
//         let homeText = document.createElement('p');
//         homeText.classList.add('home-greeting');
//         homeText.textContent = 'Greetings, Pony fans!';
//         homeContainer.appendChild(homeText);
  
//         // Create and add the countdown text
//         let countdownText = document.createElement('p');
//         countdownText.classList.add('countdown');
//         const officialDate = new Date("2024-06-01T12:00:00"); // Set the official event date and time
//         const currentDate = new Date();
//         const timeDifference = officialDate.getTime() - currentDate.getTime();

//         // Check if the current date is before the event date
//         if (timeDifference > 0) {
//             // Set up a countdown interval to update every second
//             const countdownInterval = setInterval(() => {
//                 const updatedCurrentDate = new Date();
//                 const updatedTimeDifference = officialDate.getTime() - updatedCurrentDate.getTime();

//                 // Calculate days, hours, minutes, and seconds until the event
//                 const elapsedDays = Math.floor(updatedTimeDifference / (3600 * 24 * 1000));
//                 const elapsedHours = Math.floor((updatedTimeDifference % (3600 * 24 * 1000)) / (3600 * 1000));
//                 const elapsedMinutes = Math.floor((updatedTimeDifference % (3600 * 1000)) / (60 * 1000));
//                 const elapsedSeconds = Math.floor((updatedTimeDifference % (60 * 1000)) / 1000);

//                 // Update the countdown text
//                 countdownText.innerHTML = `Listen up, pedal-pushers! The Redbull Goni Pony is making its triumphant return in exactly... <br><br><strong>${elapsedDays} days, ${elapsedHours} hours, ${elapsedMinutes} minutes, and ${elapsedSeconds} seconds</strong><br><br> We're gonna be riding vintage bikes up the <a href="https://kranjska-gora.si/en/attractions/vrsic-pass-and-the-russian-road">Vršič Pass</a>. That's 13.5 km, 801m uphill with an average incline of 7.25%!<br>On bikes with no gears! It's like trying to eat soup with a fork, man. But hey, they say 'No gear, no fear!'<br>If you're into that sort of thing, you can <a href="https://www.redbull.com/si-sl/events/goni-pony" target="_blank">register here</a>. It's gonna be a wild ride. Kinda like if nostalgia and adrenaline had a baby, and that baby was really into cycling. See you and your old-timey bikes in Kranjska Gora on <strong>${officialDate.toDateString()}</strong>.`;

//                 // Stop the interval when the countdown reaches zero
//                 if (updatedTimeDifference <= 0) {
//                     clearInterval(countdownInterval);
//                     countdownText.innerHTML = "And they're off! The race has officially begun, and the results will sprint faster than a team of racing snails. In less than 24 hours, we'll unveil the triumphant pedal pushers on our website. But if you simply can't wait, you might catch a tantalizing glimpse of the official results that will be published at <a href=https://www.timingljubljana.si/>Timing Ljubljana</a>";
//                 }
//             }, 1000);

//             homeContainer.appendChild(countdownText);
//         } else {
//             countdownText.innerHTML = "The event has started!";
//             homeContainer.appendChild(countdownText);
//         }

//         // Insert the home container into the DOM
//         let buttonContainer = document.querySelector('.button-container');
//         if (buttonContainer) {
//             buttonContainer.parentNode.insertBefore(homeContainer, buttonContainer.nextSibling);
//         }
//     }
// }



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


