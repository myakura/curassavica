async function checkModelAvailability() {
	try {
		const modelAvailability = await Summarizer.availability();

		if (modelAvailability.available === 'no') {
			console.error("Summarizer model is not available.");
			return "Error: Summarizer model is not available.";
		}
		else if (modelAvailability.available === 'after-download') {
			console.log("Summarizer model needs to be downloaded. Attempting to start download.");
			// This call is only to trigger the download.
			Summarizer.create(); // Removed monitor as it's not supported
			return "Status: Summarizer model downloading. Please wait.";
		}
		else if (modelAvailability.available === 'readily') {
			// console.log("Summarizer model is readily available."); // Optional: keep or remove this log
			return "readily";
		}
		else {
			console.error("Unknown Summarizer model availability status:", modelAvailability.available);
			return "Error: Unknown Summarizer model availability status.";
		}
	}
	catch (error) {
		console.error("Error during Summarizer model availability check:", error);
		return "Error: Could not check Summarizer model availability.";
	}
}

async function summarizeText(text) {
	try {
		console.log("summarizeText called, creating Summarizer session (model assumed available).");
		const session = await Summarizer.create();

		if (!session) {
			console.error("Summarizer session creation failed in summarizeText.");
			return "Error: Failed to create Summarizer session.";
		}

		const response = await session.summarize({ text: text, type: "tldr", length: "long" });
		return response;
	}
	catch (error) {
		console.error("Error during summarization in summarizeText with Summarizer API:", error);
		return "Error: Summarization failed with Summarizer API.";
	}
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		const availabilityStatus = await checkModelAvailability();

		if (availabilityStatus === "readily") {
			const summaryResult = await summarizeText(message.text);
			sendResponse({ summary: summaryResult });
		}
		else {
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
