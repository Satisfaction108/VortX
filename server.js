const express = require('express');
const axios = require('axios');
const cookieSession = require('cookie-session');
const app = express();

const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';

app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['your_secret_key']
}));

app.get('/', (req, res) => {
  res.send('<a href="https://discord.com/oauth2/authorize?client_id=' + CLIENT_ID + '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) + '&response_type=code&scope=identify">Login with Discord</a>');
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

  const user = req.session.user;
  res.send(`
    <h1>Welcome!</h1>
    <img src="${user.avatar ? 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png' : 'https://cdn.discordapp.com/embed/avatars/0.png'}" width="100" />
    <p>${user.username}</p>
    <a href="/">Logout</a>
  `);
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
