// Veritas AI — Frontend Controller

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const newsInput = document.getElementById('newsInput');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const btnClear = document.getElementById('btnClear');
    const btnScan = document.getElementById('btnScan');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const scannerConsole = document.getElementById('scannerConsole');
    const resultsSection = document.getElementById('resultsSection');
    
    // Verdict Elements
    const verdictCard = document.getElementById('verdictCard');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictLabel = document.getElementById('verdictLabel');
    const verdictDescription = document.getElementById('verdictDescription');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');
    
    // Gauge Elements
    const gaugeRealFill = document.getElementById('gaugeRealFill');
    const gaugeRealPercent = document.getElementById('gaugeRealPercent');
    const gaugeFakeFill = document.getElementById('gaugeFakeFill');
    const gaugeFakePercent = document.getElementById('gaugeFakePercent');
    
    // Terminal Log Elements
    const logWordCount = document.getElementById('logWordCount');
    const logVerdictLine = document.getElementById('logVerdictLine');
    const terminalLog = document.querySelector('.terminal-log');
    
    // Sample Buttons
    const btnSampleReal = document.getElementById('btnSampleReal');
    const btnSampleFake = document.getElementById('btnSampleFake');
    
    // History Elements
    const historySection = document.getElementById('historySection');
    const historyGrid = document.getElementById('historyGrid');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // Constants
    const MIN_WORDS = 5;
    const GAUGE_CIRCUMFERENCE = 251.2; // 2 * pi * r (r = 40)

    // Sample Texts
    const SAMPLES = {
        real: `WASHINGTON (Reuters) - The U.S. Senate voted overwhelmingly on Thursday to pass a landmark bipartisan bill aimed at boosting domestic semiconductor manufacturing. The legislation, which includes $52 billion in subsidies and tax incentives, is designed to strengthen national security, secure supply chains, and increase technological competitiveness against international manufacturers. Tech companies have welcomed the support, indicating plans to break ground on new fabrication facilities across several states immediately.`,
        fake: `ALERT: Secret documents leaked from a classified briefing reveal that high-altitude atmospheric lasers are being deployed nationwide to manipulate weather patterns. Insider reports claim the government is using this technology to create artificial storm systems and control agriculture yields. Spread the word and share this post immediately before social media platforms completely block it and delete this post!`
    };

    // Initialize History
    let scanHistory = JSON.parse(localStorage.getItem('veritas_history') || '[]');
    renderHistory();

    // Event Listeners
    newsInput.addEventListener('input', updateCounts);
    btnClear.addEventListener('click', clearInput);
    btnScan.addEventListener('click', runScan);
    
    btnSampleReal.addEventListener('click', () => loadSample('real'));
    btnSampleFake.addEventListener('click', () => loadSample('fake'));
    btnClearHistory.addEventListener('click', clearHistory);

    // Update character and word counts
    function updateCounts() {
        const text = newsInput.value.trim();
        const charLen = text.length;
        const words = text === '' ? 0 : text.split(/\s+/).length;
        
        charCount.textContent = charLen;
        wordCount.textContent = words;
        
        if (words < MIN_WORDS) {
            btnScan.disabled = true;
            wordCount.style.color = '#ef4444';
        } else {
            btnScan.disabled = false;
            wordCount.style.color = '';
        }
    }

    // Load sample text
    function loadSample(type) {
        newsInput.value = SAMPLES[type];
        updateCounts();
        // Remove active state from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (type === 'real') btnSampleReal.classList.add('active');
        if (type === 'fake') btnSampleFake.classList.add('active');
    }

    // Clear input
    function clearInput() {
        newsInput.value = '';
        updateCounts();
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tab-btn').classList.add('active'); // Reactivate Article Analysis tab
        resultsSection.classList.add('hidden');
    }

    // Add log line to terminal widget
    function addLogLine(text, type = 'SYSTEM') {
        const line = document.createElement('div');
        line.className = 'log-line';
        if (type === 'OUTPUT') {
            line.className = 'log-line command-output';
            line.innerHTML = text;
        } else {
            line.innerHTML = `<span class="log-timestamp">[${type}]</span> ${text}`;
        }
        terminalLog.appendChild(line);
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    // Reset log content with defaults
    function resetLogs(wordCountValue) {
        terminalLog.innerHTML = `
            <div class="log-line"><span class="log-timestamp">[SYSTEM]</span> Initializing parser... Done.</div>
            <div class="log-line"><span class="log-timestamp">[SYSTEM]</span> Preprocessing text: converting lowercase, stripping special chars... Done.</div>
            <div class="log-line"><span class="log-timestamp">[METRIC]</span> Word count: ${wordCountValue} words analyzed.</div>
            <div class="log-line"><span class="log-timestamp">[TFIDF]</span> Transforming tokens to 10k dimension vector... Done.</div>
            <div class="log-line"><span class="log-timestamp">[CLASSIFIER]</span> Evaluating vector using Logistic Regression coefficients...</div>
        `;
    }

    // Run prediction scan
    async function runScan() {
        const text = newsInput.value.trim();
        const words = text.split(/\s+/).length;

        if (words < MIN_WORDS) return;

        // Enter scanning loading state
        scannerConsole.classList.add('scanning');
        btnScan.disabled = true;
        newsInput.disabled = true;
        btnSpinner.style.display = 'block';
        btnText.textContent = 'Scanning...';
        resultsSection.classList.add('hidden');

        resetLogs(words);

        try {
            // Fake animation latency to show off parsing phases
            await new Promise(resolve => setTimeout(resolve, 800));
            addLogLine("Fitting feature matrix with TF-IDF vocabulary weights...", "TFIDF");
            await new Promise(resolve => setTimeout(resolve, 600));
            addLogLine("Calculating Logistic Sigmoid functions...", "CLASSIFIER");

            const response = await fetch('http://127.0.0.1:5000/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (data.status === 'success') {
                await new Promise(resolve => setTimeout(resolve, 300));
                displayResults(data, text);
            } else {
                addLogLine(`Prediction Failed: ${data.message}`, 'ERROR');
            }

        } catch (error) {
            console.error('Scan error:', error);
            addLogLine(`Network error connecting to model API server. Ensure backend is running.`, 'ERROR');
        } finally {
            // Reset scan button states
            scannerConsole.classList.remove('scanning');
            btnScan.disabled = false;
            newsInput.disabled = false;
            btnSpinner.style.display = 'none';
            btnText.textContent = 'Scan Article';
        }
    }

    // Display prediction result cards
    function displayResults(data, originalText) {
        resultsSection.classList.remove('hidden');
        
        // Remove previous verdict styles
        verdictCard.classList.remove('real', 'fake', 'uncertain');
        
        const verdict = data.verdict;
        const confidence = data.confidence;
        const realProb = data.probabilities.real;
        const fakeProb = data.probabilities.fake;

        // Update Verdict Card UI
        if (verdict === 'Real News') {
            verdictCard.classList.add('real');
            verdictLabel.textContent = 'REAL NEWS';
            verdictDescription.textContent = 'Linguistic structures closely match verified journalistic reports (Reuters/AP datasets).';
            verdictIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            `;
        } else if (verdict === 'Fake News') {
            verdictCard.classList.add('fake');
            verdictLabel.textContent = 'FAKE NEWS';
            verdictDescription.textContent = 'High density of sensationalized language, exclamation marks, or unsupported claims detected.';
            verdictIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `;
        } else {
            verdictCard.classList.add('uncertain');
            verdictLabel.textContent = 'UNCERTAIN';
            verdictDescription.textContent = 'The vocabulary features are mixed, providing no high-probability confidence threshold (&lt;75%).';
            verdictIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `;
        }

        // Set confidence value text and fill width
        confidenceValue.textContent = (confidence * 100).toFixed(1) + '%';
        confidenceFill.style.width = (confidence * 100) + '%';

        // Update Gauges
        setGaugeOffset(gaugeRealFill, realProb);
        gaugeRealPercent.textContent = (realProb * 100).toFixed(0) + '%';

        setGaugeOffset(gaugeFakeFill, fakeProb);
        gaugeFakePercent.textContent = (fakeProb * 100).toFixed(0) + '%';

        // Terminal logging outputs
        addLogLine(`Output class resolved: [${verdict.toUpperCase()}]`, 'CLASSIFIER');
        addLogLine(`Confidence matrix: Real: ${(realProb*100).toFixed(2)}% | Fake: ${(fakeProb*100).toFixed(2)}%`, 'CLASSIFIER');
        addLogLine(`Prediction loaded successfully in 0.04s. Check interactive meters above.`, 'OUTPUT');

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Save scan in local history
        saveToHistory({
            text: originalText,
            verdict: verdict,
            confidence: confidence,
            probabilities: { real: realProb, fake: fakeProb },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    // Set SVG gauge progress offset
    function setGaugeOffset(element, probability) {
        const offset = GAUGE_CIRCUMFERENCE - (probability * GAUGE_CIRCUMFERENCE);
        element.style.strokeDashoffset = offset;
    }

    // Save item in localStorage history
    function saveToHistory(scanItem) {
        // Prevent duplicate consecutive entries with identical text
        if (scanHistory.length > 0 && scanHistory[0].text === scanItem.text) {
            return;
        }

        // Add to front of history list
        scanHistory.unshift(scanItem);

        // Keep maximum 6 records
        if (scanHistory.length > 6) {
            scanHistory.pop();
        }

        localStorage.setItem('veritas_history', JSON.stringify(scanHistory));
        renderHistory();
    }

    // Render local history items
    function renderHistory() {
        if (scanHistory.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyGrid.innerHTML = '';

        scanHistory.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'history-card glass-panel';
            
            let tagClass = 'uncertain';
            if (item.verdict === 'Real News') tagClass = 'real';
            if (item.verdict === 'Fake News') tagClass = 'fake';

            card.innerHTML = `
                <div class="history-card-header">
                    <span class="history-tag ${tagClass}">${item.verdict}</span>
                    <span class="history-time">${item.timestamp}</span>
                </div>
                <div class="history-text">${escapeHtml(item.text)}</div>
                <div class="history-meta">
                    <span>Conf: ${(item.confidence * 100).toFixed(0)}%</span>
                    <span>Real: ${(item.probabilities.real * 100).toFixed(0)}% | Fake: ${(item.probabilities.fake * 100).toFixed(0)}%</span>
                </div>
            `;

            // Clicking a history card restores the text and loads results instantly
            card.addEventListener('click', () => {
                newsInput.value = item.text;
                updateCounts();
                displayResults({
                    verdict: item.verdict,
                    confidence: item.confidence,
                    probabilities: item.probabilities
                }, item.text);
            });

            historyGrid.appendChild(card);
        });
    }

    // Clear history logs
    function clearHistory() {
        scanHistory = [];
        localStorage.removeItem('veritas_history');
        renderHistory();
    }

    // Escape raw HTML strings
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
