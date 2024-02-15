document.getElementById('addTimer').addEventListener('click', addTimer);

document.addEventListener('DOMContentLoaded', function() {
    loadTimersState();
	sortTimersByRemainingTime();
	toggleCompletedHeader();
	updateColorCounters();
});

document.getElementById('toggleSpecialButtons').addEventListener('click', function() {
    var specialButtonsContainer = document.getElementById('specialButtonsContainer');
	 var toggleButton = document.getElementById('toggleSpecialButtons');
    if (specialButtonsContainer.style.display === 'none') {
        specialButtonsContainer.style.display = 'block';
		 toggleButton.textContent = 'Less..'; 
    } else {
        specialButtonsContainer.style.display = 'none';
		 toggleButton.textContent = 'More..'; 
    }
});

// Add global variables to track the nearest timer and finished count
let nearestTimerSeconds = Number.MAX_SAFE_INTEGER;
let finishedTimersCount = 0;

const maxBarSeconds = 86400;

function toggleCompletedHeader() {
    const completedItemsContainer = document.getElementById('completedTimers');
    const completedHeader = document.getElementById('completedHeader');
    
    // Check if there are any completed items
    if (completedItemsContainer.children.length > 0) {
        completedHeader.style.display = 'block'; // Show the header
    } else {
        completedHeader.style.display = 'none'; // Hide the header
    }
}

function addTimer() {
	
    const days = parseInt(document.getElementById('daysInput').value) || 0;
    const hours = parseInt(document.getElementById('hoursInput').value) || 0;
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const color = document.getElementById('colorSelect').value;
    const icon = document.getElementById('iconSelect').value;
    const totalSeconds = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60);

    if (totalSeconds > 0) {
        const endTime = Date.now() + (totalSeconds * 1000);
        createTimerElement(endTime, color, icon);
    } else {
        alert("Please enter a valid time greater than 0.");
    }
	
	document.getElementById('daysInput').value = '';
	document.getElementById('hoursInput').value = '';
	document.getElementById('minutesInput').value = '';
	
	toggleCompletedHeader();
	
	sortTimersByRemainingTime();
	
	saveTimersState();
}

function updateNearestTimerDisplay() {
    const timers = Array.from(document.querySelectorAll('.timer'));
    let nearestTime = null; // Declare nearestTime with initial value null

    if (timers.length > 0) {
        // Sort timers by their end time in ascending order
        timers.sort((a, b) => parseInt(a.getAttribute('data-end-time')) - parseInt(b.getAttribute('data-end-time')));

        // Get the current time
        const now = Date.now();
        
        // Find the nearest timer that has not yet finished
        const nearestTimer = timers.find(timer => parseInt(timer.getAttribute('data-end-time')) > now);
        
        // If there's a nearest active timer, calculate the time remaining
        if (nearestTimer) {
            const endTime = parseInt(nearestTimer.getAttribute('data-end-time'));
            const timeLeft = endTime - now;
            // Ensure nearestTime is set properly for the updateTabTitle function
            nearestTime = Math.floor(timeLeft / 1000); // Convert milliseconds to seconds
        }
    }

    // Assuming finishedTimersCount is calculated and updated elsewhere in your code
    // Update the tab title with the nearest time (in seconds) or null if no active timers
    updateTabTitle(nearestTime, finishedTimersCount);
}


function createTimerElement(endTime, color, icon) {

    const timersList = document.getElementById('timersList');
    const timerElement = document.createElement('div');
    timerElement.classList.add('timer');
    timerElement.setAttribute('data-color', color);

    // Create a container just for the icon and the time string
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('details-container');

    // Create an img element for the icon and add to the details container
    const iconElement = document.createElement('img');
    iconElement.classList.add('icon');
    iconElement.src = getIconPath(icon); // This function will return the correct path
    iconElement.alt = icon; // The alt attribute should be the value for accessibility
    detailsContainer.appendChild(iconElement);

    // Create the time string span and add to the details container
    const timeString = document.createElement('span');
    timeString.classList.add('time-string');
    detailsContainer.appendChild(timeString);

    // Create a span for the completion time and add it to the details container
    const completionTimeElement = document.createElement('span');
    completionTimeElement.classList.add('completion-time');
    detailsContainer.appendChild(completionTimeElement);

    // Add the details container to the timer element
    timerElement.appendChild(detailsContainer);

    // Create progress bar container and progress bar
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBar.style.width = '0%'; // Start with 0% width
    progressContainer.appendChild(progressBar);

	// Create a text element for the color key
    const colorKey = document.createElement('span');
    colorKey.classList.add('color-key');
    colorKey.textContent = color; // Set the text content to the color key
    progressContainer.appendChild(colorKey); // Append the color key to the progress container

    // Add the progress bar container to the timer element
    timerElement.appendChild(progressContainer);

    // Append the timer to the list
    timersList.appendChild(timerElement);

    // Create a button to remove the timer
    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.classList.add('remove-timer-btn');
    
    // Set an event listener on the button to handle the click event
    removeButton.addEventListener('click', function() {
        // This will remove the timer from the DOM
        timersList.removeChild(timerElement);
        // Here you can also add any other cleanup code if needed (e.g., clearing intervals)
		saveTimersState();
		toggleCompletedHeader();
    });

    // Append the remove button to the timer element
    timerElement.appendChild(removeButton);

	// Convert endTime to a Date object for formatting
    const completionDate = new Date(endTime);
    // Format the completion time for display
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    completionTimeElement.textContent = completionDate.toLocaleString(undefined, options);


    // Append the timer to the list
    timersList.appendChild(timerElement);
 
    // Store the formatted completion time in a data attribute	
	timerElement.setAttribute('data-end-time', endTime.toString());
    timerElement.setAttribute('data-color', color);
    timerElement.setAttribute('data-icon', icon);
	
    const interval = setInterval(() => {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;
        const remainingSeconds = Math.max(0, Math.floor(remainingTime / 1000));
        const percentage = Math.max(0, (remainingTime / (maxBarSeconds * 1000)) * 100);

        progressBar.style.width = percentage + '%';
        timeString.textContent = `${formatTime(remainingSeconds)}`;

		// Inside your createTimerElement function within the setInterval callback:
		if (remainingTime <= 0) {
			 // Play the beep sound when the timer finishes
			clearInterval(interval);
			progressBar.style.width = `0%`;
			completionTimeElement.textContent = `Ended`;
			moveToCompleted(timerElement, color, icon);
			updateNearestTimerDisplay(); // Add this line
		} else {
			updateNearestTimerDisplay(); // Add this line
		}
     
    }, 1000);
} 


function exportToJson() {
	saveTimersState();
    // Retrieve the timers data from localStorage
    const timersData = localStorage.getItem('timers'); // Replace 'timers' with your actual localStorage key
    // Set the data to the textarea
    document.getElementById('jsonTextField').value = timersData;
}

function importFromJson() {
    // Get the data from the textarea
    const jsonData = document.getElementById('jsonTextField').value;
	console.log('timers:', jsonData);
    try {
        // Parse the JSON data to ensure it is valid
        const timersData = JSON.parse(jsonData);
        // Store the parsed data in localStorage
        localStorage.setItem('timers', jsonData); // Replace 'timers' with your actual localStorage key
        // Reload the timers from the stored data
        loadTimersState(); // You'll need to implement this function based on how your app loads timers
    } catch(e) {
        alert('Invalid JSON data');
    }
}

// Function to map the icon name to the corresponding PNG file
function getIconPath(iconName) {
    const iconMapping = {
        'house': 'base',
        'worker': 'builder',
        'laboratory': 'lab',
        'crown': 'hero', // Assuming you have 'hero.png' for the 'crown' option
        'pet': 'pet'
    };

    // Check if the iconName exists in the mapping, otherwise default to a generic 'default.png'
    const filename = iconMapping[iconName] || 'default';
    return `./icons/${filename}.png`;
}

function sortTimersByRemainingTime() {
    const timersList = document.getElementById('timersList');
    const timerElements = Array.from(timersList.querySelectorAll('.timer'));

    // Sort timer elements by remaining time
	timerElements.sort((a, b) => {
            return parseInt(a.getAttribute('data-end-time')) - parseInt(b.getAttribute('data-end-time'));
    });

    // Remove all timer elements from the list
    while (timersList.firstChild) {
        timersList.removeChild(timersList.firstChild);
    }

    // Re-append sorted timer elements to the list
    timerElements.forEach(timerElement => {
        timersList.appendChild(timerElement);
    });
}


function moveToCompleted(timerElement, color, icon) {
    const completedTimers = document.getElementById('completedTimers');

    // Create a new div that will act as the container for the completed timer
    const completedContainer = document.createElement('div');
    completedContainer.classList.add('completed-timer');
    completedContainer.setAttribute('data-color', color); // Set the color attribute for styling

    // Create a span to display the completion text
    const completionText = document.createElement('span');
    completionText.textContent = `Completed at: ${new Date().toLocaleTimeString()} Base: ${color}   `;

    // Add the existing icon from the timer to the completed container
    const iconElement = timerElement.querySelector('.icon').cloneNode(true);
    completedContainer.appendChild(iconElement);

    // Add the completion text to the completed container
    completedContainer.appendChild(completionText);

    // Create and add the dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'X';
    dismissBtn.classList.add('dismiss-btn');
	dismissBtn.onclick = function() {
		completedTimers.removeChild(completedContainer);
		finishedTimersCount = 0; // Decrement the finished timers count
		resetTabTitleIfNoTimers();
		saveTimersState();
		toggleCompletedHeader();
	};
    completedContainer.appendChild(dismissBtn);

    // Append the completed container to the completed timers list
    completedTimers.appendChild(completedContainer);

   finishedTimersCount += 1;
   updateNearestTimerDisplay();

    // Finally, remove the original timer from the timers list
    timerElement.remove();
	
		const beepSound = new Audio('./audio/beep.mp3'); 
		beepSound.play();
		
		toggleCompletedHeader();
}

function updateProgressBar(progressBar, startTime, totalSeconds) {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = totalSeconds - elapsed;
    const percentage = (remaining / totalSeconds) * 100;
    progressBar.style.width = percentage.toFixed(2) + '%'; // This will format the percentage to 2 decimal places
    timeString.textContent = formatTime(remaining);
}

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    seconds -= days * 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let timeString = '';
    let unitsAdded = 0;

    if (days > 0) {
        timeString += days + 'd ';
        unitsAdded++;
    }
    if (hours > 0 && unitsAdded < 2) {
        timeString += hours + 'h ';
        unitsAdded++;
    }
    if (minutes > 0 && unitsAdded < 2) {
        timeString += minutes + 'm ';
        unitsAdded++;
    }
    if (seconds > 0 && unitsAdded < 2) {
        timeString += seconds + 's';
        unitsAdded++;
    }

    // Trim trailing space if it exists
    return timeString.trim();
}


function updateTabTitle(nearestTimeSeconds, finishedCount) {
    if (finishedCount > 0) {
        document.title = `${finishedCount} tasks finished`;
    } else if (nearestTimeSeconds) {
        document.title = `Next: ${formatTime(nearestTimeSeconds)}`;
    } else {
        document.title = "CoC Timer";
    }
}

function resetTabTitleIfNoTimers() {
    if (document.querySelectorAll('.timer').length === 0) {
        finishedTimersCount = 0; // Reset the finished timers count
        nearestTimerSeconds = Number.MAX_SAFE_INTEGER; // Reset the nearest timer seconds
        updateTabTitle(null, 0);
    }
}

function saveTimersState() {
    const timers = Array.from(document.querySelectorAll('.timer')).map(timer => {
        return {
            endTime: timer.getAttribute('data-end-time'),                   
            color: timer.getAttribute('data-color'),
            icon: timer.getAttribute('data-icon') // This should be the key for the icon
        };
    });
    localStorage.setItem('timers', JSON.stringify(timers));
	console.log('Saving timers:', timers);
	updateColorCounters();
}


function loadTimersState() {
    const savedTimers = JSON.parse(localStorage.getItem('timers')) || [];
    savedTimers.forEach(savedTimer => {
        const now = Date.now();
        const endTime = parseInt(savedTimer.endTime);
        const remainingSeconds = Math.max(0, endTime - now);
		
		console.log('Load Timers:', savedTimer, remainingSeconds);
		
        if (remainingSeconds > 0) {
            createTimerElement(parseInt(savedTimer.endTime), savedTimer.color, savedTimer.icon); // 'savedTimer.icon' is the key
            // After creating the timer, you may need to update its progress bar and other attributes
        }else {
            // Timer has expired, move directly to completed
            // Create a dummy element to satisfy moveToCompleted parameters if needed
            const dummyTimerElement = document.createElement('div');
            dummyTimerElement.classList.add('timer');
            dummyTimerElement.setAttribute('data-color', savedTimer.color);
            dummyTimerElement.setAttribute('data-icon', savedTimer.icon);

            // Create a dummy icon element for visual consistency in completed section
           const iconElement = document.createElement('img');
			iconElement.src = getIconPath(savedTimer.icon);
			iconElement.alt = savedTimer.icon;
			iconElement.classList.add('icon'); // Make sure this matches your querySelector in moveToCompleted
			dummyTimerElement.appendChild(iconElement);

            moveToCompleted(dummyTimerElement, savedTimer.color, savedTimer.icon);
		}
    });
}

function resetAndDeleteSave() {
    // Display a confirmation dialog
    const confirmation = confirm("Are you sure you want to reset and delete the saved timers?");
    
    // Check if the user confirmed
    if (confirmation) {
        // User confirmed, proceed with resetting and deleting
        localStorage.removeItem('timers');
        document.getElementById('timersList').innerHTML = ''; // Clear the timers list
        document.getElementById('completedTimers').innerHTML = ''; // Clear the completed timers
        // Reset any other state here as needed
    } else {
        // User cancelled, do nothing
    }
	updateColorCounters();
}

function removeTimer(timerId) {
    var timer = document.getElementById(timerId);
    if (timer) {
        timer.remove();
    }
    // If you're saving the timers, you would also remove it from the save data here
	saveTimersState();
}


function countTimersByColorAndCategory() {
    const timers = Array.from(document.querySelectorAll('.timer'));
    const colorCategoryCounts = {};

    timers.forEach(timer => {
        const color = timer.getAttribute('data-color');
        const category = timer.getAttribute('data-icon');
        const key = `${color}-${category}`;

        if (key in colorCategoryCounts) {
            colorCategoryCounts[key]++;
        } else {
            colorCategoryCounts[key] = 1;
        }
    });

    return colorCategoryCounts;
}


function updateColorCounters() {
	
    const colorCategoryCounts = countTimersByColorAndCategory();
    const countersContainer = document.getElementById('colorCountersContainer');

    countersContainer.innerHTML = ''; // Clear the current counters

    const colorCounters = {};

    // First, organize counts by color
    Object.keys(colorCategoryCounts).forEach(key => {
        const [color, category] = key.split('-');
        if (!colorCounters[color]) {
            colorCounters[color] = {};
        }
        if (!colorCounters[color][category]) {
            colorCounters[color][category] = 0;
        }
        colorCounters[color][category] += colorCategoryCounts[key];
    });

    // Then, create and append the counters
    Object.keys(colorCounters).sort().forEach(color => {
        const counterSpan = document.createElement('span');
        counterSpan.classList.add('color-counter');
        const colorClass = color.startsWith('account') ? color : `account${color}`;
        counterSpan.classList.add(colorClass);

        let counterText = `${color}: `;
        
        // Aggregate house and crown counts
        const houseCrownCount = (colorCounters[color]['house'] || 0) + (colorCounters[color]['crown'] || 0);
        counterText += `${houseCrownCount} | `;

        // Add counts for other categories
        const categories = ['laboratory', 'pet', 'worker'];
        categories.forEach(category => {
            const count = colorCounters[color][category] || 0;
            counterText += `${count} | `;
        });

        // Remove the trailing separator
        counterText = counterText.slice(0, -3);
        counterSpan.textContent = counterText;

        countersContainer.appendChild(counterSpan);
    });
}
