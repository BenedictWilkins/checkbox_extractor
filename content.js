// Listen for messages from the popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractCheckboxes") {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const checkboxData = [];

        checkboxes.forEach((checkbox, index) => {
            console.log(`\n--- Analyzing Checkbox ${index} ---`);

            // Get associated label
            let label = null;
            if (checkbox.id) {
                label = document.querySelector(`label[for="${checkbox.id}"]`);
            }

            // Generate a unique class for this checkbox
            const uniqueClass = `checkbox-preview-${index}`;

            // Function to get all relevant styles for an element
            function getAllRelevantStyles(element) {
                const styles = {};
                const sheets = document.styleSheets;

                for (let sheet of sheets) {
                    try {
                        const rules = sheet.cssRules || sheet.rules;
                        for (let rule of rules) {
                            if (!rule.selectorText) continue;

                            const selectors = rule.selectorText.split(',').map(s => s.trim());
                            for (let selector of selectors) {
                                try {
                                    // Match the element itself and its :checked state
                                    if (element.matches(selector.split(':')[0]) || element.matches(selector)) {
                                        styles[selector] = rule.style.cssText;
                                    }
                                } catch (e) {
                                    console.log('Invalid selector:', selector);
                                }
                            }
                        }
                    } catch (e) {
                        console.log('CORS error for stylesheet');
                    }
                }
                return styles;
            }

            // Extract current HTML and state
            const checkboxHTML = checkbox.outerHTML.replace(
                /<input([^>]+)>/,
                `<input$1${checkbox.checked ? ' checked' : ''}>`
            );

            // Get styles for checkbox and label only
            const checkboxStyles = getAllRelevantStyles(checkbox);
            const labelStyles = label ? getAllRelevantStyles(label) : {};

            // Combine all relevant styles
            const relevantStyles = { ...checkboxStyles, ...labelStyles };

            // Create a combined CSS string from all relevant styles, scoping them with the unique class
            const cssString = Object.entries(relevantStyles)
                .flatMap(([selector, style]) => {
                    const scopedSelector = selector.split(',').map(sel => {
                        const baseSelector = sel.split(' ').pop();
                        return `.${uniqueClass} ${baseSelector}`;
                    }).join(',');
                    return `${scopedSelector} { ${style} }`;
                })
                .filter((style, index, self) => self.indexOf(style) === index)
                .join('\n');

            // Update the HTML context with the unique class
            const htmlString = `<div class="${uniqueClass}">
                ${checkboxHTML}
                ${label ? label.outerHTML : ''}
            </div>`;

            checkboxData.push({
                id: checkbox.id,
                name: checkbox.name,
                checked: checkbox.checked,
                html: htmlString,
                css: cssString,
                labelText: label ? label.textContent.trim() : ''
            });
        });

        sendResponse({ checkboxes: checkboxData });
    }
    return true;
});