document.getElementById('addTimer').addEventListener('click', addTimer);

document.addEventListener('DOMContentLoaded', function() {
    loadTimersState();
	sortTimersByRemainingTime();
});

// Add global variables to track the nearest timer and finished count
let nearestTimerSeconds = Number.MAX_SAFE_INTEGER;
let finishedTimersCount = 0;

function addTimer() {
    const days = parseInt(document.getElementById('daysInput').value) || 0;
    const hours = parseInt(document.getElementById('hoursInput').value) || 0;
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const color = document.getElementById('colorSelect').value;
    const icon = document.getElementById('iconSelect').value;
    const totalSeconds = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60);

    if (totalSeconds > 0) {
        createTimerElement(totalSeconds, color, icon);
    } else {
        alert("Please enter a valid time greater than 0.");
    }
	
	sortTimersByRemainingTime();
	
	saveTimersState();
}

function updateNearestTimerDisplay() {
    const timers = Array.from(document.querySelectorAll('.timer'));
    let nearestTime = null;

    if (timers.length > 0) {
        // Find the smallest time remaining
        nearestTime = timers.reduce((min, timer) => {
            const seconds = parseInt(timer.getAttribute('data-seconds'), 10);
            return seconds < min ? seconds : min;
        }, Number.MAX_SAFE_INTEGER);
    }

    // Update the tab title with the nearest time or the finished count
    updateTabTitle(nearestTime, finishedTimersCount);
}


function createTimerElement(seconds, color, icon) {

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

   // Add the progress bar container to the timer element
    timerElement.appendChild(progressContainer);

    // Create a button to remove the timer
    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.classList.add('remove-timer-btn');
    
    // Set an event listener on the button to handle the click event
    removeButton.addEventListener('click', function() {
        // This will remove the timer from the DOM
        timersList.removeChild(timerElement);
        // Here you can also add any other cleanup code if needed (e.g., clearing intervals)
    });

    // Append the remove button to the timer element
    timerElement.appendChild(removeButton);

    // Append the timer to the list
    timersList.appendChild(timerElement);

    // Start the countdown
    const startTime = Date.now();
    const endTime = startTime + (seconds * 1000);
	
	timerElement.setAttribute('data-start-time', startTime.toString());
    timerElement.setAttribute('data-seconds', seconds.toString());
    timerElement.setAttribute('data-color', color);
    timerElement.setAttribute('data-icon', icon);
	
    const interval = setInterval(() => {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;
        const remainingSeconds = Math.max(0, Math.floor(remainingTime / 1000));
        const percentage = Math.max(0, (remainingTime / (seconds * 1000)) * 100);

        progressBar.style.width = percentage + '%';
        timeString.textContent = `${formatTime(remainingSeconds)}`;

		// Inside your createTimerElement function within the setInterval callback:
		if (remainingTime <= 0) {
			 // Play the beep sound when the timer finishes
			clearInterval(interval);
			progressBar.style.width = `0%`;
			moveToCompleted(timerElement, color, icon);
			updateNearestTimerDisplay(); // Add this line
		} else {
			timerElement.setAttribute('data-seconds', remainingSeconds); // Add this line
			updateNearestTimerDisplay(); // Add this line
		}
     
    }, 1000);
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
        const remainingTimeA = parseInt(a.getAttribute('data-seconds'));
        const remainingTimeB = parseInt(b.getAttribute('data-seconds'));
        return remainingTimeA - remainingTimeB;
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
    if (days > 0) timeString += days + 'd ';
    if (hours > 0) timeString += hours + 'h ';
    if (minutes > 0) timeString += minutes + 'm ';
    timeString += seconds + 's';

    return timeString;
}

function updateTabTitle(nearestTime, finishedCount) {
    if (finishedCount > 0) {
        document.title = `${finishedCount} tasks finished`;
    } else if (nearestTime) {
        document.title = `Next: ${formatTime(nearestTime)}`;
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
            startTime: timer.getAttribute('data-start-time'),
            seconds: timer.getAttribute('data-seconds'),
            maxTime: timer.getAttribute('data-max-time'),
            color: timer.getAttribute('data-color'),
            icon: timer.getAttribute('data-icon') // This should be the key for the icon
        };
    });
    localStorage.setItem('timers', JSON.stringify(timers));
	console.log('Saving timers:', timers);
}


function loadTimersState() {
    const savedTimers = JSON.parse(localStorage.getItem('timers')) || [];
    savedTimers.forEach(savedTimer => {
        const now = Date.now();
        const elapsed = (now - parseInt(savedTimer.startTime)) / 1000;
        const remainingSeconds = Math.max(0, parseInt(savedTimer.seconds) - elapsed);
        if (remainingSeconds > 0) {
            createTimerElement(remainingSeconds, savedTimer.color, savedTimer.icon); // 'savedTimer.icon' is the key
            // After creating the timer, you may need to update its progress bar and other attributes
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
}

function removeTimer(timerId) {
    var timer = document.getElementById(timerId);
    if (timer) {
        timer.remove();
    }
    // If you're saving the timers, you would also remove it from the save data here
}
