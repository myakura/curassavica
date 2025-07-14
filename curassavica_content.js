function getSelectedText() {
	const selection = window.getSelection();
	return selection.toString()?.trim();
}

function handleSummarizeClick() {
	const selectedText = getSelectedText();
	if (!selectedText) {
		return;
	}
	const popover = document.querySelector('#popover');
	popover.textContent = 'Sending to background for summarization...';
	popover.showPopover();

	chrome.runtime.sendMessage(
		{ action: "summarize", text: selectedText },
		(response) => {
			if (chrome.runtime.lastError) {
				console.error("Error sending message to background:", chrome.runtime.lastError.message);
				popover.textContent = "Error: Could not connect to summarizer.";
				return;
			}
			if (response && response.summary) {
				popover.textContent = response.summary;
			} else {
				popover.textContent = "Error: Invalid response from summarizer or summarization failed.";
				console.error("Invalid or missing response from background:", response);
			}
		}
	);
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
	summarize.addEventListener('click', () => {
		handleSummarizeClick();
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
