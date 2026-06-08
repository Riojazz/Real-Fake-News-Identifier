document.addEventListener('DOMContentLoaded', () => {
    const newsInput = document.getElementById('newsInput');
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const btnClear = document.getElementById('btnClear');
    const btnScan = document.getElementById('btnScan');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const scannerConsole = document.getElementById('scannerConsole');
    const resultsSection = document.getElementById('resultsSection');

    const verdictCard = document.getElementById('verdictCard');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictLabel = document.getElementById('verdictLabel');
    const verdictDescription = document.getElementById('verdictDescription');
    const confidenceValue = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');

    const gaugeRealFill = document.getElementById('gaugeRealFill');
    const gaugeRealPercent = document.getElementById('gaugeRealPercent');
    const gaugeFakeFill = document.getElementById('gaugeFakeFill');
    const gaugeFakePercent = document.getElementById('gaugeFakePercent');

    const terminalLog = document.querySelector('.terminal-log');
    const btnSampleReal = document.getElementById('btnSampleReal');
    const btnSampleFake = document.getElementById('btnSampleFake');

    const advisoryBadge = document.getElementById('advisoryBadge');
    const advisoryDetail = document.getElementById('advisoryDetail');
    const advisoryMessage = document.getElementById('advisoryMessage');
    const advisorySignals = document.getElementById('advisorySignals');
    const advisorySteps = document.getElementById('advisorySteps');

    const historySection = document.getElementById('historySection');
    const historyGrid = document.getElementById('historyGrid');
    const btnClearHistory = document.getElementById('btnClearHistory');

    const MIN_WORDS = 5;
    const GAUGE_CIRCUMFERENCE = 251.2;

    const SAMPLES = {
        real: 'WASHINGTON (Reuters) - The U.S. Senate voted overwhelmingly on Thursday to pass a landmark bipartisan bill aimed at boosting domestic semiconductor manufacturing. The legislation, which includes $52 billion in subsidies and tax incentives, is designed to strengthen national security, secure supply chains, and increase technological competitiveness against international manufacturers. Tech companies have welcomed the support, indicating plans to break ground on new fabrication facilities across several states immediately.',
        fake: 'ALERT: Secret documents leaked from a classified briefing reveal that high-altitude atmospheric lasers are being deployed nationwide to manipulate weather patterns. Insider reports claim the government is using this technology to create artificial storm systems and control agriculture yields. Spread the word and share this post immediately before social media platforms completely block it and delete this post!'
    };

    let scanHistory = JSON.parse(localStorage.getItem('veritas_history') || '[]');

    newsInput.addEventListener('input', updateCounts);
    btnClear.addEventListener('click', clearInput);
    btnScan.addEventListener('click', runScan);
    btnSampleReal.addEventListener('click', () => loadSample('real'));
    btnSampleFake.addEventListener('click', () => loadSample('fake'));
    btnClearHistory.addEventListener('click', clearHistory);

    updateCounts();
    renderHistory();

    function getDefaultVerification() {
        return {
            status: 'pattern_only',
            time_sensitive: false,
            live_fact_check: false,
            matched_signals: [],
            message: 'This result is based on language patterns learned from the training dataset. It is not a live internet fact-check.',
            recommended_steps: [
                'Use the score as a screening signal, not final proof.',
                'Check the publisher and publication date.',
                'Confirm important claims with trusted reporting.'
            ]
        };
    }

    function normalizeVerification(verification) {
        const fallback = getDefaultVerification();
        const normalized = { ...fallback, ...(verification || {}) };

        if (!Array.isArray(normalized.matched_signals)) {
            normalized.matched_signals = [];
        }

        if (!Array.isArray(normalized.recommended_steps) || normalized.recommended_steps.length === 0) {
            normalized.recommended_steps = fallback.recommended_steps;
        }

        return normalized;
    }

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

    function loadSample(type) {
        newsInput.value = SAMPLES[type];
        updateCounts();
        document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
        if (type === 'real') btnSampleReal.classList.add('active');
        if (type === 'fake') btnSampleFake.classList.add('active');
    }

    function clearInput() {
        newsInput.value = '';
        updateCounts();
        document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
        document.querySelector('.tab-btn').classList.add('active');
        resultsSection.classList.add('hidden');
    }

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

    function resetLogs(wordCountValue) {
        terminalLog.innerHTML = `
            <div class="log-line"><span class="log-timestamp">[SYSTEM]</span> Initializing parser... Done.</div>
            <div class="log-line"><span class="log-timestamp">[SYSTEM]</span> Preprocessing text: converting lowercase, stripping special chars... Done.</div>
            <div class="log-line"><span class="log-timestamp">[METRIC]</span> Word count: ${wordCountValue} words analyzed.</div>
            <div class="log-line"><span class="log-timestamp">[TFIDF]</span> Transforming tokens to vector space... Done.</div>
            <div class="log-line"><span class="log-timestamp">[CLASSIFIER]</span> Evaluating vector using Logistic Regression coefficients...</div>
            <div class="log-line"><span class="log-timestamp">[VERIFY]</span> Live verification: unavailable in this build.</div>
        `;
    }

    function getAdvisoryState(status) {
        if (status === 'needs_external_verification') {
            return {
                label: 'Latest-news caution',
                detail: 'Time-sensitive language detected',
                className: 'warning'
            };
        }

        if (status === 'low_confidence') {
            return {
                label: 'Low-confidence result',
                detail: 'Manual verification recommended',
                className: 'caution'
            };
        }

        return {
            label: 'Pattern-only result',
            detail: 'No live fact-check available',
            className: 'info'
        };
    }

    function updateAdvisory(verification) {
        const state = getAdvisoryState(verification.status);

        advisoryBadge.textContent = state.label;
        advisoryBadge.className = `advisory-badge ${state.className}`;
        advisoryDetail.textContent = state.detail;
        advisoryMessage.textContent = verification.message;

        if (verification.matched_signals.length > 0) {
            advisorySignals.classList.remove('hidden');
            advisorySignals.innerHTML = verification.matched_signals
                .map((signal) => `<span class="signal-chip">${escapeHtml(signal)}</span>`)
                .join('');
        } else {
            advisorySignals.classList.add('hidden');
            advisorySignals.innerHTML = '';
        }

        advisorySteps.innerHTML = verification.recommended_steps
            .map((step) => `<li>${escapeHtml(step)}</li>`)
            .join('');
    }

    async function runScan() {
        const text = newsInput.value.trim();
        const words = text.split(/\s+/).length;

        if (words < MIN_WORDS) return;

        scannerConsole.classList.add('scanning');
        btnScan.disabled = true;
        newsInput.disabled = true;
        btnSpinner.style.display = 'block';
        btnText.textContent = 'Scanning...';
        resultsSection.classList.add('hidden');

        resetLogs(words);

        try {
            await new Promise((resolve) => setTimeout(resolve, 700));
            addLogLine('Fitting feature matrix with TF-IDF vocabulary weights...', 'TFIDF');
            await new Promise((resolve) => setTimeout(resolve, 500));
            addLogLine('Calculating classification probabilities...', 'CLASSIFIER');

            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (data.status === 'success') {
                await new Promise((resolve) => setTimeout(resolve, 250));
                displayResults(data, text);
            } else {
                addLogLine(`Prediction failed: ${escapeHtml(data.message)}`, 'ERROR');
            }
        } catch (error) {
            console.error('Scan error:', error);
            addLogLine('Network error connecting to the Flask API. Ensure the backend is running.', 'ERROR');
        } finally {
            scannerConsole.classList.remove('scanning');
            btnScan.disabled = false;
            newsInput.disabled = false;
            btnSpinner.style.display = 'none';
            btnText.textContent = 'Scan Article';
        }
    }

    function displayResults(data, originalText, options = {}) {
        const { skipHistory = false } = options;
        const verification = normalizeVerification(data.verification);
        const metadata = data.metadata || {};
        const verdict = data.verdict;
        const confidence = data.confidence;
        const realProb = data.probabilities.real;
        const fakeProb = data.probabilities.fake;

        resultsSection.classList.remove('hidden');
        verdictCard.classList.remove('real', 'fake', 'uncertain');

        if (verdict === 'Real News') {
            verdictCard.classList.add('real');
            verdictLabel.textContent = 'REAL NEWS';
            verdictDescription.textContent = 'Language patterns are closer to real-news examples in the training dataset.';
            verdictIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            `;
        } else if (verdict === 'Fake News') {
            verdictCard.classList.add('fake');
            verdictLabel.textContent = 'FAKE NEWS';
            verdictDescription.textContent = 'Language patterns are closer to fake-news examples in the training dataset.';
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
            verdictDescription.textContent = 'The model could not make a confident distinction from this text alone.';
            verdictIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `;
        }

        confidenceValue.textContent = `${(confidence * 100).toFixed(1)}%`;
        confidenceFill.style.width = `${confidence * 100}%`;

        setGaugeOffset(gaugeRealFill, realProb);
        gaugeRealPercent.textContent = `${(realProb * 100).toFixed(0)}%`;

        setGaugeOffset(gaugeFakeFill, fakeProb);
        gaugeFakePercent.textContent = `${(fakeProb * 100).toFixed(0)}%`;

        updateAdvisory(verification);

        addLogLine(`Output class resolved: [${verdict.toUpperCase()}]`, 'CLASSIFIER');
        addLogLine(`Confidence matrix: Real ${(realProb * 100).toFixed(2)}% | Fake ${(fakeProb * 100).toFixed(2)}%`, 'CLASSIFIER');

        if (metadata.word_count) {
            addLogLine(`Word count ${metadata.word_count}; known feature hits ${metadata.known_terms || 0}.`, 'METRIC');
        }

        addLogLine(`Verification status: ${verification.status.replace(/_/g, ' ')}.`, 'VERIFY');
        addLogLine('Prediction loaded successfully. Review the guidance card before sharing the claim.', 'OUTPUT');

        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (!skipHistory) {
            saveToHistory({
                text: originalText,
                verdict,
                confidence,
                probabilities: { real: realProb, fake: fakeProb },
                verification,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    }

    function setGaugeOffset(element, probability) {
        const offset = GAUGE_CIRCUMFERENCE - (probability * GAUGE_CIRCUMFERENCE);
        element.style.strokeDashoffset = offset;
    }

    function saveToHistory(scanItem) {
        if (scanHistory.length > 0 && scanHistory[0].text === scanItem.text) {
            return;
        }

        scanHistory.unshift(scanItem);

        if (scanHistory.length > 6) {
            scanHistory.pop();
        }

        localStorage.setItem('veritas_history', JSON.stringify(scanHistory));
        renderHistory();
    }

    function renderHistory() {
        if (scanHistory.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyGrid.innerHTML = '';

        scanHistory.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'history-card glass-panel';

            let tagClass = 'uncertain';
            if (item.verdict === 'Real News') tagClass = 'real';
            if (item.verdict === 'Fake News') tagClass = 'fake';

            const verification = normalizeVerification(item.verification);
            const verificationState = getAdvisoryState(verification.status);

            card.innerHTML = `
                <div class="history-card-header">
                    <span class="history-tag ${tagClass}">${escapeHtml(item.verdict)}</span>
                    <span class="history-time">${escapeHtml(item.timestamp)}</span>
                </div>
                <div class="history-text">${escapeHtml(item.text)}</div>
                <div class="history-note">${escapeHtml(verificationState.label)}</div>
                <div class="history-meta">
                    <span>Conf: ${(item.confidence * 100).toFixed(0)}%</span>
                    <span>Real: ${(item.probabilities.real * 100).toFixed(0)}% | Fake: ${(item.probabilities.fake * 100).toFixed(0)}%</span>
                </div>
            `;

            card.addEventListener('click', () => {
                newsInput.value = item.text;
                updateCounts();
                displayResults({
                    verdict: item.verdict,
                    confidence: item.confidence,
                    probabilities: item.probabilities,
                    verification
                }, item.text, { skipHistory: true });
            });

            historyGrid.appendChild(card);
        });
    }

    function clearHistory() {
        scanHistory = [];
        localStorage.removeItem('veritas_history');
        renderHistory();
    }

    function escapeHtml(unsafe) {
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
