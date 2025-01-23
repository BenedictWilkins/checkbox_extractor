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

            // Display checkboxes in a grid
            const gridContainer = document.createElement('div');
            gridContainer.className = 'checkbox-grid';

            response.checkboxes.forEach((item, index) => {
                console.log(`Checkbox ${index} data:`, item);

                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'checkbox-wrapper';

                // Directly insert the HTML and CSS
                checkboxWrapper.innerHTML = item.html;

                // Append to grid container
                gridContainer.appendChild(checkboxWrapper);
            });

            resultsDiv.appendChild(gridContainer);
        } catch (error) {
            console.error('Message sending failed:', error);
            document.getElementById('count').textContent = 'Error: Could not communicate with the page. Make sure you\'re not on a Firefox internal page.';
        }
    } catch (error) {
        console.error('Tab query failed:', error);
        document.getElementById('count').textContent = 'Error: Could not access the current tab';
    }
}); 