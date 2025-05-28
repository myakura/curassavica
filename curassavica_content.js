

function getSelectedText() {
	const selection = window.getSelection();
	return selection.toString()?.trim();
}

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

async function handleSummarizeClick() {
	const selectedText = getSelectedText();
	if (!selectedText) {
		return;
	}
	const popover = document.querySelector('#popover');
	popover.textContent = 'Checking model availability...';
	popover.showPopover();

	const summary = await summarizeText(selectedText);
	popover.textContent = summary;
	// popover.showPopover(); // Already called, no need to call again if content is just updated
}

function handleSelectionChange() {
	const button = document.querySelector('#summarize-button');

	const selection = window.getSelection();

	if (selection.rangeCount > 0 && !selection.isCollapsed) {
		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		button.style.setProperty('--button-position-left', `${rect.right + window.scrollX}px`);
		button.style.setProperty('--button-position-top', `${rect.bottom + window.scrollY}px`);

		button.hidden = false;
	} else {
		button.hidden = true;
	}
}

function init() {
	const popover = document.createElement('div');
	popover.classList.add('curassavica-reset');
	popover.id = 'popover';
	popover.setAttribute('popover', 'manual');
	document.body.append(popover);

	const summarize = document.createElement('button');
	summarize.classList.add('curassavica-reset');
	summarize.textContent = 'Summarize';
	summarize.hidden = true;
	summarize.id = 'summarize-button';
	summarize.addEventListener('click', async () => {
		await handleSummarizeClick();
	});
	document.body.append(summarize);

	document.addEventListener('selectionchange', () => {
		handleSelectionChange();
	});

	const debug = document.createElement('div');
	debug.classList.add('curassavica-reset');
	debug.style.all = 'revert';
	debug.style.position = 'fixed';
	debug.style.right = '4px';
	debug.style.bottom = '4px';
	debug.style.border = '2px solid black';
	debug.style.padding = '4px';
	debug.style.display = 'grid';
	debug.style.gap = '4px';
	document.body.append(debug);

	const debugOpen = document.createElement('button');
	debugOpen.textContent = 'Open popover';
	debugOpen.addEventListener('click', () => {
		popover.textContent = `The Popover API provides developers with a standard, consistent, flexible mechanism for displaying popover content on top of other page content. Popover content can be controlled either declaratively using HTML attributes, or via JavaScript.`;
		popover.showPopover();
	});
	debug.append(debugOpen);

	const debugClose = document.createElement('button');
	debugClose.textContent = 'Close popover';
	debugClose.addEventListener('click', () => {
		popover.textContent = '';
		popover.hidePopover();
	});
	debug.append(debugClose);
}


init();
