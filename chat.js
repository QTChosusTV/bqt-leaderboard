
  // ✅ Safe to expose (just like Firebase config)
  const SUPABASE_URL = 'https://izlisxyrycqzuiebxuim.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bGlzeHlyeWNxenVpZWJ4dWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTI1NjksImV4cCI6MjA2NjA4ODU2OX0.TWgwtAkRzRCE2ak0i-UyL-SKjUg6j8ZNLCcnP_kTHZQ'; // safe if RLS is secure

  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username") || "Anonymous";

    const chatDiv = document.getElementById("chatMessages");
    const input = document.getElementById("chatInput");

    // Load and display messages
    async function loadMessages() {
      const { data, error } = await supabase
        .from("global-messages")
        .select("*")
        .order("time", { ascending: true });

      if (error) {
        chatDiv.innerHTML = "<p>Error loading messages.</p>";
        console.error(error);
        return;
      }

      chatDiv.innerHTML = data.map(msg => `
        <p><strong>${msg.user}</strong>: ${msg.text} (${new Date(msg.time).toLocaleString()})</p>
      `).join("");
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }

    // Post a new message
    window.sendChatMessage = async () => {
      const message = input.value.trim();
      if (!message) return;

      const { error } = await supabase
        .from("global-messages")
        .insert([{ user: username, text: message }]);

      if (error) {
        alert("Message failed to send.");
        console.error(error);
        return;
      }

      input.value = "";
      loadMessages(); // refresh messages
    };

    // Load messages on page load
    loadMessages();

    // Send message on Enter key
    input.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        sendChatMessage();
      }
    });

    // Optional: auto-refresh every 5 seconds
    setInterval(loadMessages, 5000);
  });