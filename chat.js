document.addEventListener("DOMContentLoaded", () => {
    // Get the username from the URL query parameter (consistent with user.html)
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username") || "Anonymous";
    
    // Function to load and display messages
    const loadMessages = () => {
        const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
        const chatDiv = document.getElementById("chatMessages");
        chatDiv.innerHTML = messages.map(msg => `<p><strong>${msg.user}</strong>: ${msg.text} (${msg.time})</p>`).join("");
        // Scroll to the bottom of the chat
        chatDiv.scrollTop = chatDiv.scrollHeight;
    };

    // Function to post a new message
    window.postMessage = () => {
        const input = document.getElementById("chatInput");
        const message = input.value.trim();
        if (!message) return; // Ignore empty messages
        const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
        messages.push({
            user: username,
            text: message,
            time: new Date().toLocaleString()
        });
        localStorage.setItem("chatMessages", JSON.stringify(messages));
        input.value = ""; // Clear the input
        loadMessages(); // Refresh the chat display
    };

    // Load messages on page load
    loadMessages();

    // Allow pressing Enter to send a message
    document.getElementById("chatInput").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            postMessage();
        }
    });
});