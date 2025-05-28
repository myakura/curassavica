// This is the background service worker.
// It will be used for managing the model download and other background tasks.

async function summarizeText(text) {
	try {
		const modelAvailability = await LanguageModel.availability();
		let session;

		if (modelAvailability.available === 'no') {
			console.error("Summarization model is not available.");
			return "Error: Summarization model is not available.";
		} else if (modelAvailability.available === 'after-download') {
			console.log("Model needs to be downloaded. UI will be updated.");
			// Return a message to update UI; actual download will be triggered by a subsequent call
			// when the user clicks again, after the model has been downloaded in the background
			// by the first attempt to create a session.
			// For now, we'll return the message and the session creation below will still
			// start the download in the background if this is the first time.
			// The next time the user clicks, availability should be 'readily'.
			return "Downloading: Model is downloading. Please wait.";
			// The following lines will now only be reached if we decide to change the logic
			// to proceed with download and summarization in the same call.
			// For this subtask, we return before this.
			session = await LanguageModel.create({
				monitor(m) {
					m.addEventListener("downloadprogress", (e) => {
						console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
					});
				}
			});
		} else if (modelAvailability.available === 'readily') {
			console.log("Model is ready. Creating session.");
			session = await LanguageModel.create();
		} else {
			console.error("Unknown model availability status:", modelAvailability.available);
			return "Error: Unknown model availability status.";
		}

		if (!session) {
			// This case should ideally not be reached if the above logic is correct.
			console.error("Session creation failed unexpectedly.");
			return "Error: Session creation failed.";
		}

		const prompt = {
			role: "user",
			content: `
Summarize the text:

user:
${text}

ai:
`
		};

		const response = await session.prompt(prompt);
		return response;
	}
	catch (error) {
		console.error(error);
		return 'Error';
	}
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		const result = await summarizeText(message.text);
		sendResponse({ summary: result });
		return true; // Indicates that sendResponse will be called asynchronously
	}
});
