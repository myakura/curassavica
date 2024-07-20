

function getSelectedText() {
	const selection = window.getSelection();
	return selection.toString()?.trim();
}

async function summarizeText(text) {
	try {
		const session = await window?.ai?.createTextSession();

		const prompt = `
Summarize the text:

###text###
${text}
`.trim();

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
	const summary = await summarizeText(selectedText);
	const popover = document.querySelector('#popover');
	popover.textContent = summary;
	popover.showPopover();
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
	popover.id = 'popover';
	popover.setAttribute('popover', 'manual');
	document.body.append(popover);

	const summarize = document.createElement('button');
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
}


init();
