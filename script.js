document.addEventListener("DOMContentLoaded", () => {
    // 🔑 PASTE YOUR GEMINI API KEY HERE DIRECTLY
    const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

    const diseaseInput = document.getElementById("diseaseInput");
    const generateBtn = document.getElementById("generateBtn");
    const loader = document.getElementById("loader");
    const rxOutput = document.getElementById("rxOutput");
    const rxDate = document.getElementById("rxDate");
    const rxDisease = document.getElementById("rxDisease");
    const historyList = document.getElementById("historyList");
    const newRxBtn = document.getElementById("newRxBtn");

    let history = JSON.parse(localStorage.getItem("RX_HISTORY")) || [];

    newRxBtn.addEventListener("click", () => {
        diseaseInput.value = "";
        rxOutput.innerHTML = `<div class="placeholder-text">Enter your symptoms above and click <strong>"Generate Prescription & Tests"</strong> to create a digital prescription.</div>`;
        rxDisease.textContent = "--";
        rxDate.textContent = "--/--/----";
    });

    // Generate Prescription & Tests
    generateBtn.addEventListener("click", async () => {
        const diseaseText = diseaseInput.value.trim();
        if (!diseaseText) {
            alert("Please enter a disease name or symptoms!");
            return;
        }

        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            alert("Please set your valid Gemini API Key inside script.js!");
            return;
        }

        loader.style.display = "block";
        generateBtn.disabled = true;

        const systemPrompt = `
        You are an experienced and highly competent medical specialist AI (Dr. Sami AI). 
        The user will provide a disease name or medical symptoms. Your job is to generate a comprehensive, professional digital prescription and a list of recommended diagnostic tests.

        Strictly output the response in clear English using the following structure:

        ### 🩺 Clinical Diagnosis / Observation
        [Provide a brief clinical assessment based on symptoms]

        ### 📋 Recommended Diagnostic Tests
        - [Test 1 Name] - (Reason/Purpose)
        - [Test 2 Name] - (Reason/Purpose)

        ### 💊 Prescribed Medications (Rx)
        1. **[Generic / Brand Name]** - [Dosage: e.g., 1-0-1] - [Timing: e.g., After Meals] - [Duration: e.g., 5 Days]
        2. **[Medication Name]** - [Dosage] - [Timing] - [Duration]

        ### 📝 Lifestyle & Home Care Advice
        - [Advice 1]
        - [Advice 2]

        ### 🚨 Red Flag Warning Symptoms
        - [Critical symptoms that require immediate emergency hospital visitation]
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: systemPrompt },
                            { text: `Patient Symptoms/Condition: ${diseaseText}` }
                        ]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || "API Error occurred.");
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Format and Display Output
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            rxDate.textContent = today;
            rxDisease.textContent = diseaseText.substring(0, 35) + (diseaseText.length > 35 ? "..." : "");
            
            rxOutput.innerHTML = formatMarkdown(aiResponse);

            // Save to Local History
            saveToHistory(diseaseText, aiResponse, today);

        } catch (error) {
            alert("Error: " + error.message + "\nPlease check your API Key in script.js.");
        } finally {
            loader.style.display = "none";
            generateBtn.disabled = false;
        }
    });

    // Simple Markdown Parser Function
    function formatMarkdown(text) {
        let html = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/\n/g, '<br>');
        
        return html.replace(/<\/ul><br><ul>/g, '');
    }

    // Local Storage History Management
    function saveToHistory(disease, result, date) {
        const item = { id: Date.now(), disease, result, date };
        history.unshift(item);
        if (history.length > 10) history.pop();
        localStorage.setItem("RX_HISTORY", JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = "";
        history.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.textContent = `${item.disease}`;
            div.addEventListener("click", () => {
                diseaseInput.value = item.disease;
                rxDate.textContent = item.date;
                rxDisease.textContent = item.disease;
                rxOutput.innerHTML = formatMarkdown(item.result);
            });
            historyList.appendChild(div);
        });
    }

    renderHistory();
});
