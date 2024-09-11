const express = require('express');
const axios = require('axios');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

// Your Discord credentials
const CLIENT_ID = '1283103158012219455';
const CLIENT_SECRET = 'cD87ozdWgQqaPhqtcH6_Ji7hkUMZVZLq';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Middleware to serve static files and manage sessions
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // Session lasts 24 hours
  keys: ['your_secret_key'] // Replace 'your_secret_key' with a strong, random key
}));

// Route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // Serve login.html on the home route
});

// Route to initiate Discord login
app.get('/login', (req, res) => {
  // Redirect user to Discord OAuth2 authorization page
  const authURL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;
  res.redirect(authURL);
});

// Route to handle the OAuth2 callback from Discord
app.get('/callback', async (req, res) => {
  const code = req.query.code; // Get the authorization code from the query string

  try {
    // Exchange the authorization code for an access token
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

    // Use the access token to fetch the user's profile data
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    // Store user data in the session
    req.session.user = userResponse.data;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during token exchange or user fetch:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// Route to display the dashboard after login
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/'); // If no user session, redirect to login page
  }

  // Display the user's profile info (username and avatar)
  res.send(`
    <h1>Welcome, ${req.session.user.username}!</h1>
    <img src="https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png" alt="User Avatar">
  `);
});

// Route to handle logout
app.get('/logout', (req, res) => {
  req.session = null; // Clear the session
  res.redirect('/'); // Redirect to the login page
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
