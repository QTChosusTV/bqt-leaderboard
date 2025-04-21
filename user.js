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
        const maxChange = 250; // Assume 1000 is the max rating change for scaling
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

    // Function to get the color for a given Elo rating
    function getEloColor(elo) {
        const eloNum = parseFloat(elo);
        if (eloNum >= 2400) return '#ff5555'; // Red
        if (eloNum >= 2200) return '#ffaa00'; // Orange
        if (eloNum >= 1900) return '#aa00aa'; // Purple
        if (eloNum >= 1600) return '#55aaff'; // Blue
        if (eloNum >= 1400) return '#00aaaa'; // Cyan
        if (eloNum >= 1200) return '#00aa00'; // Green
        if (eloNum >= 0) return '#aaaaaa'; // Gray
        return '#aaaaaa'; // Default to gray
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

            // Calculate y-axis bounds for better visibility
            const minElo = Math.min(...eloData);
            const maxElo = Math.max(...eloData);
            const padding = userHistory.length === 1 ? 100 : 50; // More padding for single point
            const yMin = Math.max(0, Math.floor((minElo - padding) / 100) * 100);
            const yMax = Math.ceil((maxElo + padding) / 100) * 100;

            // Define Elo ranges with transition bands
            const transitionWidth = 30; // 15 Elo points below and above each threshold
            const eloRanges = [
                { start: 0, end: 1200, color: '#aaaaaa' }, // Gray
                { start: 1200, end: 1400, color: '#00aa00' }, // Green
                { start: 1400, end: 1600, color: '#00aaaa' }, // Cyan
                { start: 1600, end: 1900, color: '#55aaff' }, // Blue
                { start: 1900, end: 2200, color: '#aa00aa' }, // Purple
                { start: 2200, end: 2400, color: '#ffaa00' }, // Orange
                { start: 2400, end: Infinity, color: '#ff5555' } // Red
            ];

            // Register a plugin for the banded gradient background
            const gradientPlugin = {
                id: 'gradientBackground',
                beforeDraw(chart) {
                    const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);

                    // Get the actual yMin and yMax from the chart's y-axis
                    const chartYMin = y.min;
                    const chartYMax = y.max;
                    const yRange = chartYMax - chartYMin;

                    // Create an array of points for the gradient (solid bands and transitions)
                    const points = [];

                    // Add points for each range within the visible y-axis
                    eloRanges.forEach((range, index) => {
                        if (range.end < chartYMin || range.start > chartYMax) return; // Skip if range is outside visible area

                        const prevRange = eloRanges[index - 1];
                        const nextRange = eloRanges[index + 1];

                        // Calculate the start and end of the solid color band
                        const solidStart = Math.max(chartYMin, range.start);
                        const solidEnd = Math.min(chartYMax, range.end);

                        // Adjust for transition bands
                        let bandStart = solidStart;
                        let bandEnd = solidEnd;

                        // Check for transition from previous range
                        if (prevRange && solidStart === range.start) {
                            const transitionStart = Math.max(chartYMin, range.start - transitionWidth / 2);
                            const transitionEnd = Math.min(chartYMax, range.start + transitionWidth / 2);
                            if (transitionStart < chartYMax && transitionEnd > chartYMin) {
                                points.push({ elo: transitionStart, color: prevRange.color });
                                points.push({ elo: transitionEnd, color: range.color });
                                bandStart = transitionEnd;
                            }
                        }

                        // Add the solid color band
                        if (bandStart < chartYMax && bandEnd > chartYMin) {
                            points.push({ elo: bandStart, color: range.color });
                            points.push({ elo: bandEnd, color: range.color });
                        }

                        // Check for transition to next range
                        if (nextRange && solidEnd === range.end) {
                            const transitionStart = Math.max(chartYMin, range.end - transitionWidth / 2);
                            const transitionEnd = Math.min(chartYMax, range.end + transitionWidth / 2);
                            if (transitionStart < chartYMax && transitionEnd > chartYMin) {
                                points.push({ elo: transitionStart, color: range.color });
                                points.push({ elo: transitionEnd, color: nextRange.color });
                            }
                        }
                    });

                    // Sort points by Elo
                    points.sort((a, b) => a.elo - b.elo);

                    // Add color stops for each point
                    points.forEach(point => {
                        const position = (point.elo - chartYMin) / yRange;
                        if (position >= 0 && position <= 1) {
                            gradient.addColorStop(position, point.color);
                        }
                    });

                    ctx.save();
                    ctx.fillStyle = gradient;
                    ctx.fillRect(left, top, right - left, bottom - top);
                    ctx.restore();
                }
            };

            Chart.register(gradientPlugin);

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
                            min: yMin,
                            max: yMax,
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
