const express = require('express');
const mentorTableHandler = require('./api/mentor-table.js');

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

app.listen(port, host, () => {
  console.log(`Mentor API listening on http://${host}:${port}`);
});
