const express = require('express');
const axios = require('axios');
const cookieSession = require('cookie-session');
const app = express();
const path = require('path');

const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['your_secret_key']
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  const authURL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(authURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    scope: 'identify'
  }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  });

  req.session.user = userResponse.data;
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

