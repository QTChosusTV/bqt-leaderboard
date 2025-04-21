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

    // Function to determine the color shade for rating change
    function getRatingChangeColor(ratingChange) {
        const maxChange = 500; // Assume 500 is the max rating change for scaling
        const absChange = Math.abs(ratingChange);
        // Scale lightness between 30% (dark) and 70% (light) based on magnitude
        const lightness = 70 - (absChange / maxChange) * 40;
        const clampedLightness = Math.max(30, Math.min(70, lightness)); // Ensure lightness is between 30% and 70%
        
        if (ratingChange >= 0) {
            // Green for positive change (hue: 120), darker for larger change
            return `hsl(120, 100%, ${clampedLightness}%)`;
        } else {
            // Red for negative change (hue: 0), darker for more negative change
            return `hsl(0, 100%, ${clampedLightness}%)`;
        }
    }

    try {
        // Get username from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get("username");
        if (!username) {
            document.getElementById("username").textContent = "Error: No username provided";
            return;
        }
        document.getElementById("username").textContent = username;

        // Fetch contest history
        const response = await fetch("contest_history.json");
        const data = await response.json();
        const userHistory = data[username] || [];

        // Set current rating (from the latest contest) and apply color
        const currentRating = userHistory.length ? userHistory[userHistory.length - 1].elo : "N/A";
        const eloClass = getEloClass(currentRating);
        const usernameElement = document.getElementById("username");
        const ratingElement = document.getElementById("currentRating");
        ratingElement.textContent = `(${currentRating})`;
        if (eloClass) {
            usernameElement.classList.add(eloClass);
            ratingElement.classList.add(eloClass);
            console.log(`Applied class ${eloClass} to usernameElement:`, usernameElement.className);
            console.log(`Applied class ${eloClass} to ratingElement:`, ratingElement.className);
        }

        // Populate contest list
        const contestList = document.getElementById("contestList");
        userHistory.forEach(contest => {
            const li = document.createElement("li");
            li.textContent = contest.name;
            contestList.appendChild(li);
        });

        // Populate contest history table with rating changes and colors
        const tbody = document.querySelector("#history tbody");
        let previousElo = 0; // Starting Elo before any contests
        userHistory.forEach(contest => {
            const currentElo = contest.elo;
            const ratingChange = currentElo - previousElo;
            const ratingChangeText = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
            const ratingChangeColor = getRatingChangeColor(ratingChange);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${contest.contestId}</td>
                <td>${contest.name}</td>
                <td>${contest.date}</td>
                <td>${contest.rank}</td>
                <td class="${getEloClass(currentElo)}">${currentElo}</td>
                <td style="color: ${ratingChangeColor}">${ratingChangeText}</td>
            `;
            tbody.appendChild(tr);
            previousElo = currentElo;
        });

        // Check if Chart.js is loaded
        if (typeof Chart === "undefined") {
            console.error("Chart.js failed to load. Ensure chart.min.js is the correct UMD bundle (chart.umd.min.js from Chart.js 4.4.2).");
            document.getElementById("eloChart").style.display = "none";
            const errorDiv = document.createElement("div");
            errorDiv.textContent = "Error: Unable to load graph library.";
            errorDiv.style.color = "#ff5555";
            errorDiv.style.textAlign = "center";
            document.getElementById("eloChart").parentNode.appendChild(errorDiv);
            return;
        } else {
            console.log("Chart.js loaded successfully.");
        }

        // Render Codeforces-like Elo graph if there is data
        if (userHistory.length === 0) {
            document.getElementById("eloChart").style.display = "none";
            const noDataDiv = document.createElement("div");
            noDataDiv.textContent = "No contest history available to display graph.";
            noDataDiv.style.color = "#e0e0e0";
            noDataDiv.style.textAlign = "center";
            document.getElementById("eloChart").parentNode.appendChild(noDataDiv);
        } else {
            const labels = userHistory.map(contest => `${contest.name} (#${contest.contestId})`);
            const eloData = userHistory.map(contest => contest.elo);
            const tooltips = userHistory.map(contest => ({
                contestId: contest.contestId,
                name: contest.name,
                date: contest.date,
                rank: contest.rank,
                elo: contest.elo
            }));

            new Chart(document.getElementById("eloChart"), {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Elo Rating",
                        data: eloData,
                        borderColor: "#ff5555",
                        backgroundColor: "rgba(255, 85, 85, 0.2)",
                        pointBackgroundColor: "#ff5555",
                        pointBorderColor: "#ffffff",
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: { display: true, text: "Contests", color: "#e0e0e0", font: { size: 14 } },
                            ticks: { color: "#e0e0e0" },
                            grid: { color: "#444" }
                        },
                        y: {
                            title: { display: true, text: "Elo Rating", color: "#e0e0e0", font: { size: 14 } },
                            ticks: { color: "#e0e0e0" },
                            grid: { color: "#444" },
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        legend: { labels: { color: "#e0e0e0", font: { size: 14 } } },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                title: context => context[0].label,
                                label: context => {
                                    const { contestId, name, date, rank, elo } = tooltips[context.dataIndex];
                                    return [
                                        `Contest: ${name} (#${contestId})`,
                                        `Date: ${date}`,
                                        `Rank: ${rank}`,
                                        `Elo: ${elo}`
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error fetching or rendering data:", error);
        document.getElementById("username").textContent = `Error loading history (${username || "unknown"})`;
    }
});