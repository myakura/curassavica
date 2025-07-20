async function getSummarizer() {
	const availability = await Summarizer.availability();
	if (availability === 'unavailable') {
		return null;
	}

	if (availability === 'downloadable' || availability === 'downloading') {
		console.log(`Summarizer status is ${availability}. Ensuring model is downloaded and ready.`);
		const summarizer = await Summarizer.create({
			type: 'tldr',
			length: 'long',
			monitor(m) {
				m.addEventListener('downloadprogress', (e) => {
					const percentage = e.loaded / e.total * 100;
					console.log(`Model downloading: ${percentage.toFixed(2)}%`);
				});
			}
		});
		await summarizer.ready;
		console.log("Summarizer model is ready.");
		return summarizer;
	}

	return await Summarizer.create({ type: 'tldr', length: 'long' });
}

chrome.runtime.onInstalled.addListener(async (details) => {
	try {
		console.log("Extension installed or updated. Reason:", details.reason);
		await getSummarizer();
	} catch (error) {
		console.error("Error during onInstalled listener:", error);
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "summarize" && message.text) {
		(async () => {
			try {
				const summarizer = await getSummarizer();
				if (!summarizer) {
					sendResponse({ error: "Summarizer is unavailable." });
					return;
				}

				console.log("Optimistically creating summarizer and summarizing...");
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
