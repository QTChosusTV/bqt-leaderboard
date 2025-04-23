document.addEventListener("DOMContentLoaded", async () => {
    // Function to determine Elo color class
    function getEloClass(elo) {
        const eloNum = parseFloat(elo);
        if (eloNum >= 3000) return "elo-3000-plus";
        if (eloNum >= 2700) return "elo-2700-3000";
        if (eloNum >= 2500) return "elo-2500-2700";
        if (eloNum >= 2300) return "elo-2300-2500";
        if (eloNum >= 2100) return "elo-2100-2300";
        if (eloNum >= 1900) return "elo-1900-2100";
        if (eloNum >= 1600) return "elo-1600-1900";
        if (eloNum >= 1400) return "elo-1400-1600";
        if (eloNum >= 1200) return "elo-1200-1400";
        if (eloNum >= 0) return "elo-0-1200";
        return "";
    }

    function getEloTitle(elo) {
        const eloNum = parseFloat(elo);
        if (eloNum >= 3000) return "[Legendary master]";
        if (eloNum >= 2700) return "[Grandmaster]";
        if (eloNum >= 2500) return "[International master]";
        if (eloNum >= 2300) return "[National master]";
        if (eloNum >= 2100) return "[Master]";
        if (eloNum >= 1900) return "[Candidate master]";
        if (eloNum >= 1600) return "[Expert]";
        if (eloNum >= 1400) return "[Specialist]";
        if (eloNum >= 1200) return "[Pupil]";
        if (eloNum >= 0) return "[Newbie]";
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
            const { username, elo } = user; // Removed 'rank' since it's not in the user object

            const tr = document.createElement("tr");

            // Determine the CSS class and text label based on Elo
            let eloClass = getEloClass(elo);
            let char = "";

            const eloNum = parseFloat(elo);
            char = getEloTitle(eloNum);

            // Add top-100 class for bold text
            const top100Class = index < 100 ? "elo-top-100" : "";

            // Combine classes for username
            const usernameClassList = [eloClass, top100Class].filter(cls => cls).join(" ");
            // Use eloClass for Elo cell
            const eloClassList = eloClass;

            // Add the text label to the username and wrap in a link
            const formattedUsername = char ? `${char} ${username}` : username;

            // Calculate the rank (1-based index)
            const rank = index + 1;

            // Create table row with rank, username, and elo
            tr.innerHTML = `
                <td>${rank}</td>
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
