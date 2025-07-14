chrome.runtime.onInstalled.addListener(async (details) => {
	try {
		console.log("Extension installed or updated. Reason:", details.reason);
		const state = await Summarizer.availability();
		if (state.available === 'downloadable' || state.available === 'downloading') {
			console.log(`Summarizer status is ${state.available}. Ensuring model is downloaded and ready.`);
			const summarizer = await Summarizer.create({ type: 'tldr', length: 'long' });

			summarizer.addEventListener('downloadprogress', (e) => {
				const percentage = e.loaded / e.total * 100;
				console.log(`Model downloading: ${percentage.toFixed(2)}%`);
			});

			await summarizer.ready;
			console.log("Summarizer model is ready.");
		} else {
			console.log(`Summarizer status on install: ${state.available}`);
		}
	} catch (error) {
		console.error("Error during onInstalled listener:", error);
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		(async () => {
			try {
				console.log("Optimistically creating summarizer and summarizing...");
				const summarizer = await Summarizer.create({ type: 'tldr', length: 'long' });
				const summary = await summarizer.summarize(message.text);
				sendResponse({ summary: summary });
			} catch (error) {
				console.error("Error during summarization attempt:", error);
				// It's better to send the error message back to the content script
				// so it can display a meaningful error to the user.
				sendResponse({ error: error.message });
			}
		})();
		return true; // Keep the message channel open for async sendResponse
	}
});
