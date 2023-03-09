const express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'public', 'views'));

app.get('/subathon', (req, res) => {
    res.render('timer.ejs');
});

app.get('/api', async (req, res) => {
    if(req.query.error) return;
    if(!req.query.code) return;

    const params = new URLSearchParams();
    params.set('client_id', json.client_id);
    params.set('client_secret', json.client_secret)
    params.set('code', req.query.code);
    params.set('grant_type', 'authorization_code');
    params.set('redirect_uri', 'http://localhost/api');

    let response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: params.toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const tokens = await response.json();
    if(tokens.error || !tokens.access_token) return res.redirect(req.originalUrl);


    json.token = tokens;

    fs.writeFileSync(`../config.json`, JSON.stringify(json, null, 4));
    res.redirect(`https://twitch.tv/moderator/${json.channel}`);
});

app.listen(80, () => console.log(`Backend is online`));