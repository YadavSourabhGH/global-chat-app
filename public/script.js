let lastMsgNum = 1; // Initialize to 1

// Set username in local storage if not set
async function setUsername() {
    const username = document.getElementById("usernameInput").value;
    if (username) {
        try {
            const response = await fetch("http://localhost:3000/setusername", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                localStorage.setItem("username", username);
                const modal = new bootstrap.Modal(document.getElementById("usernameModal"));
                modal.hide(); // Close the modal
                startChat(); // Start the chat after setting the username
                location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.error); // Show error message if username is taken
            }
        } catch (error) {
            console.error("Failed to set username:", error);
        }
    }
}

// Show username modal if not set
function checkUsername() {
    const username = localStorage.getItem("username");
    if (!username) {
        const modal = new bootstrap.Modal(document.getElementById("usernameModal"));
        modal.show(); // Show modal if no username is set
    } else {
        startChat(); // If username exists, start chat
    }
}

function startChat() {
    document.getElementById("chatContainer").style.display = "block"; // Show chat container
    fetchMessages(); // Initial load
    setInterval(fetchMessages, 500); // Fetch new messages every 500ms
}

// Toggle emoji selector
function toggleEmojiSelector() {
    const emojiSelector = document.getElementById("emojiSelector");
    emojiSelector.style.display = emojiSelector.style.display === "none" ? "flex" : "none";
}

// Add emoji to input field
function addEmoji(emoji) {
    document.getElementById("chatInput").value += emoji;
    toggleEmojiSelector();
}

async function sendMessage(event) {
    event.preventDefault(); // Prevent the default form submission

    const messageText = document.getElementById("chatInput").value;
    const username = localStorage.getItem("username");

    if (messageText.trim() === '') return; // Do not send empty messages

    try {
        await fetch("http://localhost:3000/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ msg: messageText, username })
        });

        document.getElementById("chatInput").value = ''; // Clear input field
        fetchMessages(); // Load the latest messages immediately after sending
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

// Fetch new messages from the server
async function fetchMessages() {
    try {
        const response = await fetch("http://localhost:3000/getlatestmsg", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fromid: lastMsgNum })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const messages = await response.json();
        if (messages.length) {
            messages.forEach(msg => {
                if (msg.msgnum >= lastMsgNum) {
                    addMessageToChat(msg.username, msg.msg, msg.username === localStorage.getItem("username") ? "sender" : "reader");
                    lastMsgNum = msg.msgnum + 1; // Update lastMsgNum to latest msgnum
                }
            });
        }
    } catch (error) {
        console.error("Failed to fetch messages:", error);
    }
}

// Add message to the chat area
function addMessageToChat(username, message, type) {
    const chatArea = document.getElementById("chatArea");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", type);
    messageElement.innerHTML = `<div class="message"><strong>${username}:</strong> ${message}</div>`;
    chatArea.appendChild(messageElement);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
}

// Initialize check for username on load
checkUsername();
