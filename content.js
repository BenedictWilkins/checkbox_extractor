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

// Function to capture styles for a checkbox and its label based on the checked state
function captureStyles(checkbox, label) {
    const styles = {
        checkboxStyles: getAllElementStyles(checkbox),
        pseudoBefore: getPseudoElementStyles(checkbox, '::before'),
        pseudoAfter: getPseudoElementStyles(checkbox, '::after'),
        labelStyles: label ? getAllElementStyles(label) : '',
        labelPseudoBefore: label ? getPseudoElementStyles(label, '::before') : '',
        labelPseudoAfter: label ? getPseudoElementStyles(label, '::after') : ''
    };

    return styles;
}

// Utility function to add a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setAndWait(checkbox, checked) {
    return new Promise(resolve => {
        let resolved = false;

        const onEnd = (event) => {
            if (event.target === checkbox) {
                console.log('Checkbox animation ended!');
                checkbox.removeEventListener('transitionend', onEnd);
                checkbox.removeEventListener('animationend', onEnd);
                resolved = true;
                resolve();
            }
        };
        checkbox.addEventListener('transitionend', onEnd);
        checkbox.addEventListener('animationend', onEnd);

        // Set a fallback timeout to resolve the promise
        setTimeout(() => {
            if (!resolved) {
                checkbox.removeEventListener('transitionend', onEnd);
                checkbox.removeEventListener('animationend', onEnd);
                resolve();
                resolved = true;
            }
        }, 500);
        checkbox.checked = checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

// Function to extract checkboxes and their labels with scoped styles
async function extractCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const checkboxData = [];

    // Create an array of promises for processing each checkbox
    const checkboxPromises = Array.from(checkboxes).map(async (checkbox, index) => {
        console.log(`Processing checkbox ${index}`);

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        const checkboxIdChecked = `checkbox-checked-${index}`;
        const checkboxIdUnchecked = `checkbox-unchecked-${index}`;
        const labelId = `label-${index}`;

        const checkedState = checkbox.checked;

        // Capture styles for the unchecked state
        await setAndWait(checkbox, false);
        const uncheckedStyles = captureStyles(checkbox, label);

        // Capture styles for the checked state
        await setAndWait(checkbox, true);
        const checkedStyles = captureStyles(checkbox, label);

        // Restore the original checked state
        checkbox.checked = checkedState;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        const uncheckedContainerHTML = `
            <div id="unchecked-container-${index}" style="display: inline-block; width: auto;">
                <style>
                    #${checkboxIdUnchecked} { ${uncheckedStyles.checkboxStyles} }
                    #${checkboxIdUnchecked}::before { ${uncheckedStyles.pseudoBefore} }
                    #${checkboxIdUnchecked}::after { ${uncheckedStyles.pseudoAfter} }
                    #${labelId}-unchecked { ${uncheckedStyles.labelStyles} }
                    #${labelId}-unchecked::before { ${uncheckedStyles.labelPseudoBefore} }
                    #${labelId}-unchecked::after { ${uncheckedStyles.labelPseudoAfter} }
                </style>
                <input type="checkbox" id="${checkboxIdUnchecked}">
                <label for="${checkboxIdUnchecked}" id="${labelId}-unchecked"></label>
            </div>
        `;

        const checkedContainerHTML = `
            <div id="checked-container-${index}" style="display: inline-block; width: auto;">
                <style>
                    #${checkboxIdChecked} { ${checkedStyles.checkboxStyles} }
                    #${checkboxIdChecked}::before { ${checkedStyles.pseudoBefore} }
                    #${checkboxIdChecked}::after { ${checkedStyles.pseudoAfter} }
                    #${labelId}-checked { ${checkedStyles.labelStyles} }
                    #${labelId}-checked::before { ${checkedStyles.labelPseudoBefore} }
                    #${labelId}-checked::after { ${checkedStyles.labelPseudoAfter} }
                </style>
                <input type="checkbox" id="${checkboxIdChecked}" checked>
                <label for="${checkboxIdChecked}" id="${labelId}-checked"></label>
            </div>
        `;

        checkboxData.push({
            html: uncheckedContainerHTML + checkedContainerHTML
        });

        console.log(`Checkbox ${index} processed`);
    });

    // Wait for all checkbox processing to complete
    await Promise.all(checkboxPromises);

    return { checkboxes: checkboxData };
}

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractCheckboxes") {
        console.log('Received extractCheckboxes action');
        extractCheckboxes().then(data => sendResponse(data));
        return true; // Keep the message channel open for async response
    }
});