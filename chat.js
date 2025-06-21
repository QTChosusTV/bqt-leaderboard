document.addEventListener("DOMContentLoaded", () => {
  // ✅ Safe Supabase config (can be in GitHub)
  const SUPABASE_URL = 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = 'your-anon-key';

  // ✅ Initialize Supabase inside DOMContentLoaded
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // Send message to Supabase
  window.sendChatMessage = async () => {
    const message = input.value.trim();
    if (!message) return;

    const { error } = await supabase
      .from("global-messages")
      .insert([{ user: username, text: message }]);

    if (error) {
      alert("Failed to send message.");
      console.error(error);
      return;
    }

    input.value = "";
    loadMessages();
  };

  // Initial load
  loadMessages();

  // Send on Enter key
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      window.sendChatMessage();
    }
  });

  // Optional: refresh every 5 seconds
  setInterval(loadMessages, 5000);
});
