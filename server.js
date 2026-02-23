const fs = require('fs');
const path = require('path');
const express = require('express');
const mentorTableHandler = require('./api/mentor-table.js');
const mentorDebugPromptHandler = require('./api/mentor-debug-prompt.js');

function stripWrappingQuotes(value) {
  if (typeof value !== 'string' || value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function loadDotEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    const rawValue = match[2].replace(/\s+#.*$/, '');
    const value = stripWrappingQuotes(rawValue);
    process.env[key] = value;
  }
}

loadDotEnvFile('.env.local');
loadDotEnvFile('.env');

const app = express();
const port = Number(process.env.MENTOR_API_PORT || 8787);
const host = process.env.MENTOR_API_HOST || '127.0.0.1';

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'mentor-api' });
});

app.all('/api/mentor-table', async (req, res) => {
  await mentorTableHandler(req, res);
});

app.all('/api/mentor-debug-prompt', async (req, res) => {
  await mentorDebugPromptHandler(req, res);
});

app.listen(port, host, () => {
  console.log(`Mentor API listening on http://${host}:${port}`);
});
