document.getElementById('extract').addEventListener('click', async () => {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
            document.getElementById('count').textContent = 'Error: No active tab found';
            return;
        }

        // Add this line to keep popup open during debugging
        document.body.style.minWidth = '500px';
        document.body.style.minHeight = '500px';

        try {
            const response = await browser.tabs.sendMessage(tabs[0].id, { action: "extractCheckboxes" });
            console.log('Raw response from content script:', response); // Debug log that we should now see

            const resultsDiv = document.getElementById('results');
            const countDiv = document.getElementById('count');
            resultsDiv.innerHTML = '';

            if (!response || !response.checkboxes) {
                countDiv.textContent = 'Error: Invalid response format';
                return;
            }

            const checkboxCount = response.checkboxes.length;
            countDiv.textContent = `Found ${checkboxCount} checkbox${checkboxCount !== 1 ? 'es' : ''}`;

            // Log each checkbox data before processing
            response.checkboxes.forEach((item, index) => {
                console.log(`Checkbox ${index} data:`, item);

                const itemDiv = document.createElement('div');
                itemDiv.className = 'checkbox-item';

                // Create HTML section
                const htmlSection = document.createElement('div');
                htmlSection.className = 'section';
                const htmlLabel = document.createElement('h4');
                htmlLabel.textContent = 'HTML:';
                const htmlPre = document.createElement('pre');
                htmlPre.textContent = item.html || 'No HTML found';
                htmlSection.appendChild(htmlLabel);
                htmlSection.appendChild(htmlPre);

                // Create CSS section
                const cssSection = document.createElement('div');
                cssSection.className = 'section';
                const cssLabel = document.createElement('h4');
                cssLabel.textContent = 'CSS:';
                const cssPre = document.createElement('pre');
                cssPre.textContent = item.css || 'No CSS found';
                cssSection.appendChild(cssLabel);
                cssSection.appendChild(cssPre);

                // Add a visual preview with proper styling container
                const previewSection = document.createElement('div');
                previewSection.className = 'section preview';
                const previewLabel = document.createElement('h4');
                previewLabel.textContent = 'Preview:';
                const previewDiv = document.createElement('div');
                previewDiv.className = `preview-container preview-${index}`;

                if (item.html && item.css) {
                    // Create a style element for this checkbox
                    const styleElement = document.createElement('style');
                    styleElement.textContent = item.css;
                    previewDiv.appendChild(styleElement);

                    // Add the HTML structure
                    previewDiv.insertAdjacentHTML('beforeend', item.html);

                    // If the checkbox was originally checked, maintain that state
                    const checkbox = previewDiv.querySelector('input[type="checkbox"]');
                    console.log('Checkbox:', checkbox.outerHTML);
                    if (checkbox) {
                        checkbox.checked = item.checked;
                        console.log('Checkbox state:', checkbox.checked);
                    }
                    console.log(previewDiv.innerHTML);
                } else {
                    previewDiv.textContent = 'No preview available';
                }

                previewSection.appendChild(previewLabel);
                previewSection.appendChild(previewDiv);

                // Add sections to item div
                itemDiv.appendChild(previewSection);
                itemDiv.appendChild(htmlSection);
                itemDiv.appendChild(cssSection);
                resultsDiv.appendChild(itemDiv);
            });
        } catch (error) {
            console.error('Message sending failed:', error);
            document.getElementById('count').textContent = 'Error: Could not communicate with the page. Make sure you\'re not on a Firefox internal page.';
        }
    } catch (error) {
        console.error('Tab query failed:', error);
        document.getElementById('count').textContent = 'Error: Could not access the current tab';
    }
}); 