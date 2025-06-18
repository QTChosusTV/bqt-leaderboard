document.addEventListener("DOMContentLoaded", async () => {
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

    function getRatingChangeColor(ratingChange) {
        const maxChange = 500;
        const absChange = Math.abs(ratingChange);
        const lightness = 70 - (absChange / maxChange) * 40;
        const clampedLightness = Math.max(30, Math.min(70, lightness));

        if (ratingChange >= 0) {
            return `hsl(120, 100%, ${clampedLightness}%)`;
        } else {
            return `hsl(0, 100%, ${clampedLightness}%)`;
        }
    }

    function getEloColor(elo) {
        const eloNum = parseFloat(elo);
        if (eloNum >= 3000) return '#8b0000';
        if (eloNum >= 2700) return '#ff0000';
        if (eloNum >= 2500) return '#ff7575';
        if (eloNum >= 2300) return '#ffaa00';
        if (eloNum >= 2100) return '#fbff00';
        if (eloNum >= 1900) return '#aa00aa';
        if (eloNum >= 1600) return '#55aaff';
        if (eloNum >= 1400) return '#00aaaa';
        if (eloNum >= 1200) return '#00aa00';
        if (eloNum >= 0) return '#aaaaaa';
    }

    const usernameElement = document.getElementById("username");
    const ratingElement = document.getElementById("currentRating");
    const titleElement = document.getElementById("userTitle");

    let username = "Unknown";
    let currentRating = 0;
    let userHistory = [];

    try {
        const urlParams = new URLSearchParams(window.location.search);
        username = urlParams.get("username");
        if (!username) {
            usernameElement.textContent = "No username provided";
            titleElement.textContent = " [Error]";
            ratingElement.textContent = "(N/A)";
            titleElement.classList.add("elo-0-1200");
            return;
        }

        usernameElement.textContent = ` ${username}`;
        titleElement.textContent = " [Loading]";
        ratingElement.textContent = "(Loading)";

        const response = await fetch("contest_history.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        userHistory = data[username] || [];

        const currentRatingRaw = userHistory.length ? userHistory[userHistory.length - 1].elo : 0;
        currentRating = parseFloat(currentRatingRaw);

        const eloClass = getEloClass(currentRating);
        const title = getEloTitle(currentRating);

        ratingElement.textContent = userHistory.length ? `(${currentRating})` : "(N/A)";
        usernameElement.textContent = ` ${username}`;
        titleElement.textContent = ` ${title}`;

        if (eloClass) {
            usernameElement.classList.add(eloClass);
            ratingElement.classList.add(eloClass);
            titleElement.classList.add(eloClass);
        }

        const contestList = document.getElementById("contestList");
        userHistory.forEach(contest => {
            const li = document.createElement("li");
            li.textContent = contest.name;
            contestList.appendChild(li);
        });

        const tbody = document.querySelector("#history tbody");
        let previousElo = 0;
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

        if (typeof Chart === "undefined") {
            document.getElementById("eloChart").style.display = "none";
            const errorDiv = document.createElement("div");
            errorDiv.textContent = "Error: Unable to load graph library.";
            errorDiv.style.color = "#ff5555";
            errorDiv.style.textAlign = "center";
            document.getElementById("eloChart").parentNode.appendChild(errorDiv);
            return;
        }

        const labels = userHistory.map(contest => `${contest.name} (#${contest.contestId})`);
        const eloData = userHistory.map(contest => contest.elo);
        const tooltips = userHistory.map(contest => ({
            contestId: contest.contestId,
            name: contest.name,
            date: contest.date,
            rank: contest.rank,
            elo: contest.elo
        }));

        const pointColors = eloData.map(elo => getEloColor(elo));
        const minElo = Math.min(...eloData);
        const maxElo = Math.max(...eloData);
        const padding = userHistory.length === 1 ? 250 : 100;
        const yMin = Math.max(0, Math.floor((minElo - padding) / 10) * 10);
        const yMax = Math.ceil(((maxElo + padding) / 10) * 10);

        const transitionWidth = 100;
        const eloRanges = [
            { start: 0, end: 1200 - (transitionWidth / 4), color: '#aaaaaa' },
            { start: 1200, end: 1400 - (transitionWidth / 4), color: '#00aa00' },
            { start: 1400, end: 1600 - (transitionWidth / 4), color: '#00aaaa' },
            { start: 1600, end: 1900 - (transitionWidth / 4), color: '#55aaff' },
            { start: 1900, end: 2200 - (transitionWidth / 4), color: '#aa00aa' },
            { start: 2200, end: 2400 - (transitionWidth / 4), color: '#ffaa00' },
            { start: 2400, end: Infinity, color: '#ff5555' }
        ];

        const gradientPlugin = {
            id: 'gradientBackground',
            beforeDatasetsDraw(chart) {
                const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
                const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                const chartYMin = y.min;
                const chartYMax = y.max;
                const yRange = chartYMax - chartYMin;
                const points = [];

                eloRanges.forEach((range, index) => {
                    if (range.end < chartYMin || range.start > chartYMax) return;
                    const prevRange = eloRanges[index - 1];
                    const nextRange = eloRanges[index + 1];
                    const solidStart = Math.max(chartYMin, range.start);
                    const solidEnd = Math.min(chartYMax, range.end);
                    let bandStart = solidStart;
                    let bandEnd = solidEnd;

                    if (prevRange && solidStart === range.start) {
                        const transitionStart = Math.max(chartYMin, range.start - transitionWidth / 2);
                        const transitionEnd = Math.min(chartYMax, range.start + transitionWidth / 2);
                        if (transitionStart < chartYMax && transitionEnd > chartYMin) {
                            points.push({ elo: transitionStart, color: prevRange.color });
                            points.push({ elo: transitionEnd, color: range.color });
                            bandStart = transitionEnd;
                        }
                    }

                    if (bandStart < chartYMax && bandEnd > chartYMin) {
                        points.push({ elo: bandStart, color: range.color });
                        points.push({ elo: bandEnd, color: range.color });
                    }

                    if (nextRange && solidEnd === range.end) {
                        const transitionStart = Math.max(chartYMin, range.end - transitionWidth / 2);
                        const transitionEnd = Math.min(chartYMax, range.end + transitionWidth / 2);
                        if (transitionStart < chartYMax && transitionEnd > chartYMin) {
                            points.push({ elo: transitionStart, color: range.color });
                            points.push({ elo: transitionEnd, color: nextRange.color });
                        }
                    }
                });

                points.sort((a, b) => a.elo - b.elo);
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
                    borderColor: '#f1f1f1',
                    backgroundColor: 'rgba(255, 85, 85, 0.2)', 
                    pointBackgroundColor: pointColors,
                    pointBorderColor: "#ffffff",
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                layout: { padding: 10 },
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
    } catch (error) {
        console.error("Error fetching or rendering data:", error);
        usernameElement.textContent = ` ${username} (Error loading history)`;
        titleElement.textContent = " [Error]";
        ratingElement.textContent = "(N/A)";
        titleElement.classList.add("elo-0-1200");
        ratingElement.classList.add("elo-0-1200");
    }
});
