// Function to extract all styles for a given element
function getAllElementStyles(element) {
    const styles = window.getComputedStyle(element);
    let styleString = '';

    for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        styleString += `${prop}: ${styles.getPropertyValue(prop)}; `;
    }

    return styleString;
}

// Function to extract styles for pseudo-elements
function getPseudoElementStyles(element, pseudo) {
    const styles = window.getComputedStyle(element, pseudo);
    let styleString = '';

    for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        styleString += `${prop}: ${styles.getPropertyValue(prop)}; `;
    }

    return styleString;
}

// Function to extract checkboxes and their labels with scoped styles
function extractCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const checkboxData = [];

    checkboxes.forEach((checkbox, index) => {
        console.log(`Processing checkbox ${index}`);

        const label = document.querySelector(`label[for="${checkbox.id}"]`) || checkbox.closest('label');
        const checkboxId = `checkbox-${index}`;
        const labelId = `label-${index}`;

        const checkboxHTML = `<input type="checkbox" id="${checkboxId}" ${checkbox.checked ? 'checked' : ''}>`;
        const labelHTML = label ? `<label for="${checkboxId}" id="${labelId}">${label.innerHTML}</label>` : '';

        const styleContent = `
            #${checkboxId} { ${getAllElementStyles(checkbox)} }
            #${labelId} { ${label ? getAllElementStyles(label) : ''} }
            #${checkboxId}::before { ${getPseudoElementStyles(checkbox, '::before')} }
            #${checkboxId}::after { ${getPseudoElementStyles(checkbox, '::after')} }
            #${checkboxId}:checked { ${getPseudoElementStyles(checkbox, ':checked')} }
            #${labelId}::before { ${label ? getPseudoElementStyles(label, '::before') : ''} }
            #${labelId}::after { ${label ? getPseudoElementStyles(label, '::after') : ''} }
        `;

        const containerHTML = `
            <div>
                <style>${styleContent}</style>
                ${checkboxHTML}${labelHTML}
            </div>
        `;

        checkboxData.push({
            html: containerHTML
        });

        console.log(`Checkbox ${index} extracted with scoped styles`, containerHTML);
    });

    return { checkboxes: checkboxData };
}

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractCheckboxes") {
        console.log('Received extractCheckboxes action');
        const data = extractCheckboxes();
        sendResponse(data);
    }
});