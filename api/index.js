const wait = require('util').promisify(setTimeout);

function getCleanConfig() {
    delete require.cache[require.resolve('../config.json')];
    return require('../config.json');
}

async function getAccessToken() {
    const json = requireConfig();
    const scopes = ['bits:read', 'channel:read:subscriptions'];

    console.log(`Please click on the link below, whatever was tried to run will try again in 15 seconds. If it succeeded you'll be redirected to twitch`);
    console.log(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${json.client_id}&redirect_uri=${encodeURIComponent(`http://localhost/api`)}&scope=${encodeURIComponent(scopes.join(' '))}`);
}

const baseURL = 'https://api.twitch.tv/helix/';

async function get(url, headers) {
    const json = getCleanConfig();
    const fuck = await fetch(`${baseURL}${url}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${json.token.access_token}`,
            'Client-Id': json.client_id,
            ...headers
        }
    });

    if(fuck.status == 401) {
        getAccessToken();
        await wait(15000);
        get(url, headers);
    }

    return await fuck.json();
}

async function post(url, headers, body) {
    const json = getCleanConfig();

    const headers = {
        'Authorization': `Bearer ${json.token.access_token}`,
        'Client-Id': json.client_id,
        ...headers
    }

    const fuck = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        headers,
        body
    });

    if(fuck.status === 401) {
        getAccessToken()
        await wait(15000);
        post(url, headers, body);
    }

    return await fuck.json();
}

async function usernameToId(username) {
    let fuck = await get(`users?login=${username}`);
    if(fuck.data[0]) return fuck.data[0].id;
}

module.exports = { get, post, usernameToId }