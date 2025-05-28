async function checkModelAvailability() {
	try {
		const modelAvailability = await LanguageModel.availability();

		if (modelAvailability.available === 'no') {
			console.error("Summarization model is not available.");
			return "Error: Summarization model is not available.";
		} else if (modelAvailability.available === 'after-download') {
			console.log("Model needs to be downloaded. Attempting to start download.");
			// This call is only to trigger the download.
			LanguageModel.create({
				monitor(m) {
					m.addEventListener("downloadprogress", (e) => {
						console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
					});
				}
			});
			return "Status: Model downloading. Please wait.";
		} else if (modelAvailability.available === 'readily') {
			// console.log("Model is readily available."); // Optional: keep or remove this log
			return "readily";
		} else {
			console.error("Unknown model availability status:", modelAvailability.available);
			return "Error: Unknown model availability status.";
		}
	} catch (error) {
		console.error("Error during model availability check:", error);
		return "Error: Could not check model availability.";
	}
}

async function summarizeText(text) {
	try {
		console.log("summarizeText called, creating session (model assumed available).");
		const session = await LanguageModel.create();

		if (!session) {
		    console.error("Session creation failed in summarizeText.");
		    return "Error: Failed to create summarization session.";
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
		console.error("Error during summarization in summarizeText:", error);
		return "Error: Summarization failed.";
	}
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		const availabilityStatus = await checkModelAvailability();

		if (availabilityStatus === "readily") {
			const summaryResult = await summarizeText(message.text);
			sendResponse({ summary: summaryResult });
		} else {
			sendResponse({ summary: availabilityStatus });
		}
	}
	return true; // To keep the message channel open for async sendResponse
});

chrome.runtime.onInstalled.addListener(async (details) => {
	console.log("Extension installed or updated. Reason:", details.reason);
	const availabilityResult = await checkModelAvailability();
	console.log("Model availability on install:", availabilityResult);
});
