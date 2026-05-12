const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, '../../_data/raw-stats.json');
const ASSETS_DIR = path.join(__dirname, '../../assets');
const STATS_FILE = path.join(__dirname, '../../_data/stats.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Activity Graph SVG ────────────────────────────────────────────

function generateActivityGraph(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  const total = cal.totalContributions;
  const days = [];
  const months = [];
  const seenMonths = new Set();

  cal.weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day, di) => {
      const d = new Date(day.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        months.push({ week: wi, day: di, label: monthNames[d.getMonth()] });
      }
      days.push(day);
    });
  });

  const cellSize = 13;
  const cellGap = 2;
  const cols = Math.ceil(days.length / 7);
  const w = cols * (cellSize + cellGap) + 60;
  const h = 7 * (cellSize + cellGap) + 80;

  const maxCount = Math.max(1, ...days.map(d => d.contributionCount));
  const getColor = (count) => {
    if (count === 0) return '#161b22';
    const intensity = Math.min(count / maxCount, 1);
    const r = Math.round(14 + intensity * 48);
    const g = Math.round(27 + intensity * 118);
    const b = Math.round(34 + intensity * 255);
    return `rgb(${r},${g},${b})`;
  };

  let cells = '';
  days.forEach((day, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = col * (cellSize + cellGap) + 55;
    const y = row * (cellSize + cellGap) + 40;
    const color = getColor(day.contributionCount);
    cells += `    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${color}" />\n`;
  });

  const dayLabels = ['', 'Seg', '', 'Qua', '', 'Sex', ''];
  let labels = '';
  dayLabels.forEach((label, i) => {
    if (label) {
      labels += `    <text x="10" y="${i * (cellSize + cellGap) + 50}" fill="#8b949e" font-size="10" font-family="system-ui">${label}</text>\n`;
    }
  });

  let monthLabels = '';
  months.forEach(m => {
    const x = m.week * (cellSize + cellGap) + 55;
    monthLabels += `    <text x="${x}" y="28" fill="#8b949e" font-size="10" font-family="system-ui">${m.label}</text>\n`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#0d1117;border-radius:6px">
  <rect width="${w}" height="${h}" fill="#0d1117" rx="6" />
  ${monthLabels}
  ${labels}
  ${cells}
  <text x="12" y="${h - 15}" fill="#8b949e" font-size="11" font-family="system-ui">
    ${total} contribuições nos últimos 12 meses
  </text>
  <text x="${w - 20}" y="${h - 15}" fill="#58a6ff" font-size="11" font-family="system-ui" text-anchor="end">
    Menos
  </text>
  <rect x="${w - 110}" y="${h - 23}" width="10" height="10" rx="2" fill="#161b22" />
  <rect x="${w - 96}" y="${h - 23}" width="10" height="10" rx="2" fill="#0e4429" />
  <rect x="${w - 82}" y="${h - 23}" width="10" height="10" rx="2" fill="#006d32" />
  <rect x="${w - 68}" y="${h - 23}" width="10" height="10" rx="2" fill="#26a641" />
  <rect x="${w - 54}" y="${h - 23}" width="10" height="10" rx="2" fill="#39d353" />
  <text x="${w - 40}" y="${h - 15}" fill="#8b949e" font-size="11" font-family="system-ui">Mais</text>
</svg>`;
}

// ─── Stats Card SVG ────────────────────────────────────────────────

function generateStatsCard(data) {
  const w = 460, h = 280;

  // Top stats row
  const items = [
    { label: 'Commits', value: data.totalCommits, color: '#58a6ff' },
    { label: 'Repositórios', value: data.totalRepos, color: '#238636' },
    { label: 'Stars', value: data.totalStars, color: '#e3b341' },
    { label: 'Seguidores', value: data.totalFollowers, color: '#2da44e' },
    { label: 'Pull Requests', value: data.totalPullRequests, color: '#8957e5' },
  ];

  let statsRow = '';
  items.forEach((item, i) => {
    const x = 15 + (i % 3) * 150;
    const y = 35 + Math.floor(i / 3) * 42;
    statsRow += `
    <text x="${x}" y="${y}" fill="#8b949e" font-size="11" font-family="system-ui">${item.label}</text>
    <text x="${x}" y="${y + 18}" fill="#c9d1d9" font-size="20" font-weight="bold" font-family="system-ui">${item.value}</text>`;
  });

  // Language bars - estilo horizontal comprido
  const barMaxW = 380;
  let langsHtml = '';
  data.topLanguages.forEach((lang, i) => {
    const y = 125 + i * 30;
    const fillW = Math.round(barMaxW * lang.pct / 100);
    const bar = lang.pct > 0
      ? `<rect x="115" y="${y + 2}" width="${fillW}" height="18" rx="4" fill="#${lang.color}" />`
      : '';
    langsHtml += `
    <text x="15" y="${y + 15}" fill="#c9d1d9" font-size="13" font-family="system-ui" font-weight="600">${lang.name}</text>
    <rect x="115" y="${y + 2}" width="${barMaxW}" height="18" rx="4" fill="#21262d" />
    ${bar}
    <text x="505" y="${y + 15}" fill="#8b949e" font-size="13" font-family="system-ui" text-anchor="end">${lang.pct}%</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#0d1117;border-radius:6px">
  <rect width="${w}" height="${h}" fill="#0d1117" rx="6" />
  <text x="15" y="20" fill="#58a6ff" font-size="14" font-weight="bold" font-family="system-ui">📊 GitHub Stats</text>
  ${statsRow}
  <line x1="15" y1="115" x2="${w - 15}" y2="115" stroke="#21262d" stroke-width="1" />
  <text x="15" y="108" fill="#8b949e" font-size="11" font-family="system-ui">LINGUAGENS</text>
  ${langsHtml}
</svg>`;
}

// ─── Main ──────────────────────────────────────────────────────────

function main() {
  ensureDir(ASSETS_DIR);

  // Carrega dados crus da GraphQL
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  const user = raw.data.user;

  // Activity Graph
  const graphSvg = generateActivityGraph(user);
  fs.writeFileSync(path.join(ASSETS_DIR, 'activity-graph.svg'), graphSvg);
  console.log('✅ assets/activity-graph.svg generated');

  // Stats Card
  const statsData = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
  const cardSvg = generateStatsCard(statsData);
  fs.writeFileSync(path.join(ASSETS_DIR, 'stats-card.svg'), cardSvg);
  console.log('✅ assets/stats-card.svg generated');
}

main();
