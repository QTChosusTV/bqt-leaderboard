const fs = require("fs").promises;
const path = require("path");

async function appendContestData() {
    try {
        // Read contest.txt
        const contestData = await fs.readFile("contest.txt", "utf-8");
        const lines = contestData.trim().split("\n");

        // Parse contest.txt
        const contestName = lines[0].trim();
        const date = lines[1].trim(); // Read date from line 2
        const n = parseInt(lines[2].trim());
        const userEntries = lines.slice(3, 3 + n).map(line => {
            const [username, rank, elo] = line.trim().split(" ");
            return { username, rank: parseInt(rank), elo: parseInt(elo) };
        });

        // Validate date format (basic check for YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error("Invalid date format in contest.txt. Expected YYYY-MM-DD.");
        }

        // Read or initialize contest_history.json
        let history = {};
        try {
            const historyData = await fs.readFile("contest_history.json", "utf-8");
            history = JSON.parse(historyData);
        } catch (error) {
            console.log("No existing contest_history.json, creating new one.");
        }

        // Get next contest ID
        const contestIds = Object.values(history).flatMap(user => user.map(c => c.contestId));
        const nextContestId = contestIds.length ? Math.max(...contestIds) + 1 : 1;

        // Update history for each user
        userEntries.forEach(({ username, rank, elo }) => {
            if (!history[username]) {
                history[username] = [];
            }
            history[username].push({
                contestId: nextContestId,
                name: contestName,
                date,
                rank,
                elo
            });
            // Sort by contestId to ensure chronological order
            history[username].sort((a, b) => a.contestId - b.contestId);
        });

        // Save updated contest_history.json
        await fs.writeFile("contest_history.json", JSON.stringify(history, null, 2));
        console.log("Successfully updated contest_history.json");
    } catch (error) {
        console.error("Error processing contest data:", error);
    }
}

appendContestData();