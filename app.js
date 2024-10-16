const promptInput = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#p-img");
const selectedImage = document.querySelector("#selected-image");
const imageInput = document.querySelector("#image-input");
const clearBtn = document.querySelector("#Clear");
const shareBtn = document.querySelector("#Share");

// API Configuration
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDGlZocYC5XcVlajQD4Q5LrT82qIpe0RLU"; // Replace with your actual API key

// User Data Object
let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

// Function to Generate AI Response
async function generateResponse(aiChatBox) {
    const aiChatText = aiChatBox.querySelector(".ai-chat-box");
    const requestOptions = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [
                {
                    "parts": [
                        { "text": user.message },
                        ...(user.file.data ? [{ "inline_data": user.file }] : [])
                    ]
                }
            ]
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();

        // Sanitize API response to prevent XSS
        apiResponse = sanitizeHTML(apiResponse);

        aiChatText.innerHTML = apiResponse;
    } catch (error) {
        console.error("Error generating AI response:", error);
        aiChatText.innerHTML = "Sorry, I couldn't process your request. Please try again later.";
    } finally {
        scrollToBottom();
        resetImageSelection();
    }
}

// Simple sanitization function
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}


function createChatBox(html, classes) {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handleChatResponse(userMessage) {
    if (!userMessage.trim() && !user.file.data) return;

    user.message = userMessage;
    const userHtml = `
        <img src="./resources/user.png" alt="User Image" class="user-img">
        <div class="user-chat-box">
            ${user.message}
            ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
        </div>
    `;
    promptInput.value = "";
    const userChatBox = createChatBox(userHtml, "user-box");
    chatContainer.appendChild(userChatBox);
    scrollToBottom();

    const aiHtml = `
        <img src="./resources/ai.png" alt="AI Image" class="ai-img">
        <div class="ai-chat-box">
            perch is thinking....
        </div>
    `;
    const aiChatBox = createChatBox(aiHtml, "ai-box");
    chatContainer.appendChild(aiChatBox);
    scrollToBottom();

    generateResponse(aiChatBox);
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    });
}

function resetImageSelection() {
    selectedImage.src = "img.svg";
    selectedImage.classList.remove("visible");
    user.file = { mime_type: null, data: null };
}

promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatResponse(promptInput.value);
    }
});

submitBtn.addEventListener("click", () => {
    handleChatResponse(promptInput.value);
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64String
        };
        selectedImage.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        selectedImage.classList.remove("hidden");
        selectedImage.classList.add("visible");
    };
    reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
    imageInput.click();
});

clearBtn.addEventListener("click", () => {
    chatContainer.innerHTML = `
        <div class="ai-box">
            <img src="./resources/ai.png" alt="AI Image" class="ai-img">
            <div class="ai-chat-box">
                Hi there 👋, what do you want to know?
            </div>
        </div>
    `;
});


shareBtn.addEventListener("click", () => {
    const chatContent = chatContainer.innerText;

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'perchAI.txt';
    link.click();

    URL.revokeObjectURL(link.href);
});
