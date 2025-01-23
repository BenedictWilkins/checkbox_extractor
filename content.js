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

function cloneAndApplyAllStyles(element, uniquePrefix) {
    const stylesMap = new Map();
    const collectStyles = (el, path) => {
        const computedStyles = window.getComputedStyle(el);
        const elementStyles = Array.from(computedStyles).map(prop => `${prop}: ${computedStyles.getPropertyValue(prop)};`).join(' ');

        const pseudoBefore = window.getComputedStyle(el, '::before');
        const pseudoAfter = window.getComputedStyle(el, '::after');

        const beforeStyles = Array.from(pseudoBefore).map(prop => `${prop}: ${pseudoBefore.getPropertyValue(prop)};`).join(' ').trim();
        const afterStyles = Array.from(pseudoAfter).map(prop => `${prop}: ${pseudoAfter.getPropertyValue(prop)};`).join(' ').trim();

        stylesMap.set(path, {
            elementStyles,
            beforeStyles: beforeStyles ? beforeStyles : null,
            afterStyles: afterStyles ? afterStyles : null
        });
    };

    const traverseAndCollect = (el, path) => {
        collectStyles(el, path);
        Array.from(el.children).forEach((child, index) => {
            traverseAndCollect(child, `${path}-${index}`);
        });
    };

    const applyIdsToClone = (el, path) => {
        el.setAttribute('data-style-id', `${uniquePrefix}-${path}`);
        Array.from(el.children).forEach((child, index) => {
            applyIdsToClone(child, `${path}-${index}`);
        });
    };

    const generateStyleContent = () => {
        let styleContent = '';
        stylesMap.forEach((styles, path) => {
            styleContent += `
                [data-style-id="${uniquePrefix}-${path}"] { ${styles.elementStyles} }
            `;
            if (styles.beforeStyles) {
                styleContent += `
                    [data-style-id="${uniquePrefix}-${path}"]::before { ${styles.beforeStyles} }
                `;
            }
            if (styles.afterStyles) {
                styleContent += `
                    [data-style-id="${uniquePrefix}-${path}"]::after { ${styles.afterStyles} }
                `;
            }
        });
        return styleContent;
    };

    const clonedElement = element.cloneNode(true);
    const wrapper = document.createElement('div');
    wrapper.appendChild(clonedElement);

    traverseAndCollect(element, '0');
    applyIdsToClone(clonedElement, '0');

    const styleElement = document.createElement('style');
    styleElement.textContent = generateStyleContent();
    wrapper.insertBefore(styleElement, wrapper.firstChild);

    return wrapper;
}

// Function to extract checkboxes and their labels with scoped styles
async function extractCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const checkboxData = [];

    // Create an array of promises for processing each checkbox
    const checkboxPromises = Array.from(checkboxes).map(async (checkbox, index) => {
        console.log(`Processing checkbox ${index}`);

        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        let containerElement; // is either the label or the label's parent

        // Determine the element to use
        if (label && label.contains(checkbox)) {
            containerElement = label;
        } else if (label) {
            containerElement = label.parentElement;
            // check that the label parent also contains the checkbox
            if (!containerElement.contains(checkbox)) {
                console.warn(`Label parent does not contain checkbox: ${containerElement.outerHTML}`);
                return;
            }
        } else {
            console.warn(`No label found for checkbox ${index}`);
            containerElement = checkbox.parentElement;
        }


        // Clone the container and apply all styles
        const checkedState = checkbox.checked;

        // Capture styles for the unchecked state
        await setAndWait(checkbox, false);
        const uncheckedStyles = cloneAndApplyAllStyles(containerElement, `unchecked-checkbox-${index}`);

        // Capture styles for the checked state
        await setAndWait(checkbox, true);
        const checkedStyles = cloneAndApplyAllStyles(containerElement, `checked-checkbox-${index}`);

        // Restore the original checked state
        checkbox.checked = checkedState;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        const containerHTML = `
                    <div id="container-${index}" style="display: inline-block; width: auto;">
                        ${uncheckedStyles.outerHTML}
                        ${checkedStyles.outerHTML}
                    </div>
                `;

        checkboxData.push({
            html: containerHTML
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