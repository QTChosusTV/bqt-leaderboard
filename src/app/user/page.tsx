'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import './user.css';
import type { Chart } from 'chart.js';

interface Contest {
  contestId: number;
  name: string;
  date: string;
  rank: number;
  elo: number;
}

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const gradientBackgroundPlugin = {
  id: "gradientBackground",
  beforeDraw(chart: Chart) {
    const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
    const chartYMin = y.min;
    const chartYMax = y.max;
    const yRange = chartYMax - chartYMin;

    const transitionWidth = 50;
    const eloRanges = [
      { start: 0, end: 1150, color: "#aaaaaa" },
      { start: 1175, end: 1350, color: "#00aa00" },
      { start: 1375, end: 1450, color: "#00aaaa" },
      { start: 1475, end: 1550, color: "#4bdbff" },
      { start: 1575, end: 1700, color: "#55aaff" },
      { start: 1725, end: 1850, color: "#7900fa" },
      { start: 1875, end: 2050, color: "#aa00aa" },
      { start: 2075, end: 2250, color: "#fbff00" },
      { start: 2275, end: 2450, color: "#ffaa00" },
      { start: 2475, end: 2650, color: "#ff7575" },
      { start: 2675, end: 2950, color: "#ff0000" },
      { start: 2975, end: 9999999, color: "#8b0000" }
    ];

    const points: { elo: number, color: string }[] = [];

    eloRanges.forEach((range, index) => {
      if (range.end < chartYMin || range.start > chartYMax) return;

      const prev = eloRanges[index - 1];
      const next = eloRanges[index + 1];

      let bandStart = Math.max(chartYMin, range.start);
      const bandEnd = Math.min(chartYMax, range.end);

      if (prev && bandStart === range.start) {
        const ts = Math.max(chartYMin, range.start - transitionWidth / 2);
        const te = Math.min(chartYMax, range.start + transitionWidth / 2);
        points.push({ elo: ts, color: prev.color });
        points.push({ elo: te, color: range.color });
        bandStart = te;
      }

      points.push({ elo: bandStart, color: range.color });
      points.push({ elo: bandEnd, color: range.color });

      if (next && bandEnd === range.end) {
        const ts = Math.max(chartYMin, range.end - transitionWidth / 2);
        const te = Math.min(chartYMax, range.end + transitionWidth / 2);
        points.push({ elo: ts, color: range.color });
        points.push({ elo: te, color: next.color });
      }
    });

    points.sort((a, b) => a.elo - b.elo);
    points.forEach(({ elo, color }) => {
      const pos = (elo - chartYMin) / yRange;
      if (pos >= 0 && pos <= 1) gradient.addColorStop(pos, color);
    });

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();
  }
};

ChartJS.register(gradientBackgroundPlugin);

  const getEloClass = (elo: number) => {
    if (elo >= 3000) return 'elo-3000-plus'
    if (elo >= 2700) return 'elo-2700-3000'
    if (elo >= 2500) return 'elo-2500-2700'
    if (elo >= 2300) return 'elo-2300-2500'
    if (elo >= 2100) return 'elo-2100-2300'
    if (elo >= 1900) return 'elo-1900-2100'
    if (elo >= 1750) return 'elo-1750-1900'
    if (elo >= 1600) return 'elo-1600-1750'
    if (elo >= 1500) return 'elo-1500-1600'
    if (elo >= 1400) return 'elo-1400-1500'
    if (elo >= 1200) return 'elo-1200-1400'
    return 'elo-0-1200'
  }

  /*const getEloTitle = (elo: number) => {
    if (elo >= 3000) return '[Legendary master]'
    if (elo >= 2700) return '[Grandmaster]'
    if (elo >= 2500) return '[International master]'
    if (elo >= 2300) return '[National master]'
    if (elo >= 2100) return '[Master]'
    if (elo >= 1900) return '[Candidate master]'
    if (elo >= 1750) return '[Semi master]'
    if (elo >= 1600) return '[Expert]'
    if (elo >= 1500) return '[Semi expert]'
    if (elo >= 1400) return '[Specialist]'
    if (elo >= 1200) return '[Pupil]'
    return '[Newbie]'
  }*/

const getEloColor = (elo: number) => {
  if (elo >= 3000) return '#8b0000';
  if (elo >= 2700) return '#ff0000';
  if (elo >= 2500) return '#ff7575';
  if (elo >= 2300) return '#ffaa00';
  if (elo >= 2100) return '#fbff00';
  if (elo >= 1900) return '#aa00aa';
  if (elo >= 1750) return '#7900fa';
  if (elo >= 1600) return '#55aaff';
  if (elo >= 1500) return '#15d0ff';
  if (elo >= 1400) return '#00aaaa';
  if (elo >= 1200) return '#00aa00';
  return '#aaaaaa';
};

const getRatingChangeColor = (ratingChange: number) => {
  const maxChange = 500;
  const absChange = Math.abs(ratingChange);
  const lightness = 70 - (absChange / maxChange) * 40;
  const clampedLightness = Math.max(30, Math.min(70, lightness));
  return ratingChange >= 0
    ? `hsl(120, 100%, ${clampedLightness}%)`
    : `hsl(0, 100%, ${clampedLightness}%)`;
};

export default function UserPage() {
  const [username, setUsername] = useState('');
  const [history, setHistory] = useState<Contest[]>([]);
  const [elo, setElo] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uname = params.get('username');
    if (!uname) return;
    setUsername(uname);

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('elo, history')
        .eq('username', uname)
        .maybeSingle();

    
      // console.log(data)

      if (data && data.history) {
        setHistory(data.history);
        setElo(data.elo || data.history[data.history.length - 1]?.elo || 0);
      }
    };
    fetchHistory();
  }, []);


    const labels = history.map(c => `${c.name} (#${c.contestId})`);
    const data = history.map(c => c.elo);
    const pointColors = data.map(getEloColor);
    const eloValues = history.map(c => c.elo);
    const minElo = Math.min(...eloValues);
    const maxElo = Math.max(...eloValues);
    const padding = history.length === 1   ? 250 : 100;

    const yMin = Math.max(0, Math.floor((minElo - padding) / 10) * 10);
    const yMax = Math.ceil((maxElo + padding) / 10) * 10;

    const stepSizeChart = Math.ceil((yMax - yMin) / 100) * 10;

    // console.log("Calculated step:", stepSizeChart, " with 2 val(s): ", yMin, ", ", yMax);

    const chartData = {
    labels,
    datasets: [
      {
        label: "Elo Rating",
        data,
        borderColor: '#f1f1f1',
        backgroundColor: 'rgba(255,255,255,0.9)',
        pointBackgroundColor: pointColors,
        pointBorderColor: "#fff",
        pointRadius: 5,
        tension: 0.3,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    layout: { padding: 10 },
    plugins: {
      legend: { labels: { color: '#e0e0e0' } },
      tooltip: {
        callbacks: {
            label: (ctx: { dataIndex: number }) => {
                const c = history[ctx.dataIndex];
                return [`Contest: ${c.name}`, `Date: ${c.date}`, `Rank: ${c.rank}`, `Elo: ${c.elo}`];
            }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#e0e0e0' },
        grid: { color: '#444' },
        title: { display: true, text: "Contests", color: '#e0e0e0' }
      },
      y: {
        type: 'linear' as const,
        ticks: {
            color: '#e0e0e0',
            stepSize: stepSizeChart, 
            callback: function(this: unknown, tickValue: number | string): string {
  return `${tickValue}`;
}
        },
        grid: {
            color: '#555', 
            lineWidth: 1,
            borderDash: [5, 5],
        },
        min: yMin,
        max: yMax,
        title: { display: true, text: "Elo Rating", color: '#e0e0e0' }
      }
    }
  };

  const eloClass = getEloClass(elo);
  //const title = getEloTitle(elo);

  return (
    <div style={{padding: '20px'}}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <img
          src={`/assets/ranks/${eloClass}.png`}
          alt={eloClass}
          style={{
            width: '48px',
            height: '48px',
            verticalAlign: 'middle'
          }}
        />
        <h1
          id="userTitle"
          className={eloClass}
          style={{
            fontSize: '26px',
            fontWeight: 'bold',
            margin: 0
          }}
        >
          {username} ({elo})
        </h1>
      </div>

      <table id="history">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Date</th><th>Rank</th><th>Elo</th><th>Change</th>
          </tr>
        </thead>
        <tbody>
          {history.map((c, i) => {
            const prevElo = i > 0 ? history[i - 1].elo : 0;
            const change = c.elo - prevElo;
            const color = getRatingChangeColor(change);
            return (
              <tr key={c.contestId}>
                <td>{c.contestId}</td>
                <td>{c.name}</td>
                <td>{c.date}</td>
                <td>{c.rank}</td>
                <td className={getEloClass(c.elo)}>{c.elo}</td>
                <td style={{ color }}>{change >= 0 ? `+${change}` : change}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '220px',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0, marginRight: '10px' }}>Current rank:</h3>
            <img
              src={`/assets/ranks/${getEloClass(elo)}.png`}
              alt={`Current rank ${elo}`}
              style={{ width: '36px', height: '36px', transform: 'translateY(-2px)' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '220px',
              marginTop: '8px',
            }}
          >
            <h3 style={{ margin: 0, marginRight: '10px' }}>Peak rank:</h3>
            <img
              src={`/assets/ranks/${getEloClass(maxElo)}.png`}
              alt={`Peak rank ${maxElo}`}
              style={{ width: '36px', height: '36px', transform: 'translateY(-2px)' }}
            />
          </div>
        </div>




      {history.length > 0 && (
        <Line
          data={chartData}
          options={chartOptions}
        />
      )}
    </div>
  );
}