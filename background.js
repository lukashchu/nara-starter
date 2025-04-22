// Set up the daily reset alarm at 12:00 a.m.
chrome.runtime.onInstalled.addListener(() => {
  setMidnightAlarm();
  setWeeklyChallenge();
});

chrome.runtime.onStartup.addListener(() => {
  setMidnightAlarm();
  setWeeklyChallenge();
});

// Handle alarms for resetting state
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReset") {
    chrome.storage.local.set({ state: null }, () => {
      console.log("State reset at 12:00 a.m.");
    });
    setMidnightAlarm(); // Reset the alarm for the next day
  }
});

// Function to set an alarm for 12:00 a.m.
function setMidnightAlarm() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const timeUntilMidnight = (midnight - now) / (1000 * 60);
  chrome.alarms.create("dailyReset", { delayInMinutes: timeUntilMidnight });
}

// Weekly challenges
const weeklyChallenges = [
  "Drink 8 glasses of water each day",
  "Take a 10-minute walk daily",
  "Write down 3 things you're grateful for",
  "Read 10 pages of a book daily",
  "Do 10 minutes of stretching or yoga",
  "Avoid sugary snacks for a week",
  "Spend 15 minutes decluttering your space",
  "Call or message a loved one daily",
  "Practice deep breathing for 5 minutes daily",
  "Go to bed 30 minutes earlier each night"
];

function setWeeklyChallenge() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Start of the week (Sunday)
  const weekNumber = Math.floor(startOfWeek.getTime() / (1000 * 60 * 60 * 24 * 7));
  const challengeIndex = weekNumber % weeklyChallenges.length;
  const currentChallenge = weeklyChallenges[challengeIndex];

  chrome.storage.local.set({ weeklyChallenge: currentChallenge, challengeCompleted: false }, () => {
    console.log("Weekly challenge set:", currentChallenge);
  });
}

// Handle messages from newTab.js for generating subtasks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "generateSubtasks") {
    // Call GPT wrapper
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer API_TOKEN", // tbu
      },
      body: JSON.stringify({
        prompt: `Break down the task "${message.task}" into 5 subtasks.`,
        max_tokens: 100,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const subtasks = data.choices[0].text
          .trim()
          .split("\n")
          .filter(Boolean);
        chrome.runtime.sendMessage({ action: "updateSubtasks", subtasks });
      })
      .catch((error) => {
        console.error("Error generating subtasks:", error);
      });
    return true; // Keep the message channel open for async response
  }
});
