let summarizer = null;
let availability = null;

async function getOrCreateSummarizer() {
	try {
		const state = await Summarizer.availability();
		availability = state.available;

		switch (availability) {
			case 'unavailable':
				console.error("Summarizer is not available.");
				return;
			case 'downloadable':
			case 'downloading':
				if (summarizer === null) {
					console.log(`Summarizer is ${availability}. Creating and downloading model.`);
					summarizer = await Summarizer.create({ type: 'tldr', length: 'long' });
					summarizer.addEventListener('downloadprogress', (e) => {
						const percentage = e.loaded / e.total * 100;
						console.log(`Model downloading: ${percentage.toFixed(2)}%`);
					});
					console.log("Waiting for model to be ready...");
					await summarizer.ready;
					console.log("Summarizer is ready.");
					availability = 'available'; // Update state after download
				}
				break;
			case 'available':
				if (summarizer === null) {
					console.log("Summarizer is available. Creating instance.");
					summarizer = await Summarizer.create({ type: 'tldr', length: 'long' });
				}
				break;
		}
	} catch (error) {
		console.error("Error during summarizer initialization:", error);
		availability = 'unavailable'; // Set to unavailable on error
	}
}

async function summarizeText(text) {
	if (!summarizer || availability !== 'available') {
		console.error("Summarizer not ready or available.");
		return "Error: Summarizer is not ready.";
	}
	try {
		const summary = await summarizer.summarize(text);
		return summary;
	} catch (error) {
		console.error("Error during summarization:", error);
		return "Error: Summarization failed.";
	}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		(async () => {
			if (availability === null) {
				// First time check, initialize the summarizer
				await getOrCreateSummarizer();
			}

			switch (availability) {
				case 'available':
					const summaryResult = await summarizeText(message.text);
					sendResponse({ summary: summaryResult });
					break;
				case 'downloading':
				case 'downloadable':
					sendResponse({ summary: "Status: Model is downloading. Please try again in a moment." });
					break;
				case 'unavailable':
				default:
					sendResponse({ summary: "Error: Summarizer model is not available." });
					break;
			}
		})();
		return true; // To keep the message channel open for async sendResponse
	}
});

chrome.runtime.onInstalled.addListener(async (details) => {
	console.log("Extension installed or updated. Reason:", details.reason);
	// Trigger initialization on install to start download if necessary.
	getOrCreateSummarizer();
});
