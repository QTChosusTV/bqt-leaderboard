document.addEventListener("DOMContentLoaded", async () => {
    // Function to determine Elo color class
    function getEloClass(elo) {
        const eloNum = parseFloat(elo);
        if (eloNum >= 2400) return "elo-2400-plus";
        if (eloNum >= 2200) return "elo-2200-2400";
        if (eloNum >= 1900) return "elo-1900-2200";
        if (eloNum >= 1600) return "elo-1600-1900";
        if (eloNum >= 1400) return "elo-1400-1600";
        if (eloNum >= 1200) return "elo-1200-1400";
        if (eloNum >= 0) return "elo-0-1200";
        return "";
    }

    try {
        // Fetch contest history
        const response = await fetch("contest_history.json");
        const data = await response.json();

        // Extract users and their latest Elo ratings
        const users = Object.keys(data).map(username => {
            const history = data[username];
            // Get the latest Elo (from the last contest in history)
            const latestElo = history.length > 0 ? history[history.length - 1].elo : 0;
            return { username, elo: latestElo };
        });

        // Sort users by Elo in descending order
        users.sort((a, b) => b.elo - a.elo);

        // Populate the leaderboard table
        const tbody = document.querySelector("#leaderboard tbody");

        users.forEach((user, index) => {
            const { username, elo } = user;

            const tr = document.createElement("tr");

            // Determine the CSS class and text label based on Elo
            let eloClass = getEloClass(elo);
            let char = "";

            const eloNum = parseFloat(elo);
            if (eloNum >= 2400) char = "[Grandmaster]";
            else if (eloNum >= 2200) char = "[Master]";
            else if (eloNum >= 1900) char = "[Candidate master]";
            else if (eloNum >= 1600) char = "[Expert]";
            else if (eloNum >= 1400) char = "[Specialist]";
            else if (eloNum >= 1200) char = "[Pupil]";
            else if (eloNum >= 0) char = "[Newbie]";

            // Add top-100 class for bold text
            const top100Class = index < 100 ? "elo-top-100" : "";

            // Combine classes for username
            const usernameClassList = [eloClass, top100Class].filter(cls => cls).join(" ");
            // Use eloClass for Elo cell
            const eloClassList = eloClass;

            // Add the text label to the username and wrap in a link
            const formattedUsername = char ? `${username} ${char}` : username;

            // Create clickable username linking to user.html with correct username
            tr.innerHTML = `
                <td class="${usernameClassList}">
                    <a href="user.html?username=${encodeURIComponent(username)}" class="${usernameClassList}">${formattedUsername}</a>
                </td>
                <td class="${eloClassList}">${elo}</td>
            `;

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error fetching or parsing data:", error);
    }
});
