const Client = require('./api/EventSub');
const client = new Client();
const { WebSocket, WebSocketServer } = require('ws');

/** @type {WebSocket | null} */
let ws = null;
const wss = new WebSocketServer({ port: 2020 });

wss.on('connection', (socket, _) => {
    socket.on('message', (data, _) => {
        if(data.toString() == 'timer') ws = socket;
    });
});

const amounts = require('./amount.json');
const tiers = {
    '1000': 1,
    '2000': 2,
    '3000': 3,
    default: 1
}

try {
    require('./config.json');
} catch (e) {
    require('node:fs').writeFileSync('./config.json', JSON.stringify({
        "channel": "",
        "client_id": "",
        "client_secret": "",
        "token": {}
    }, null, 4));
    process.exit();
}

client.on('cheer', (amount) => {
    if(amount < 500) return;
    let time = amount % 500;
    time = time * (amounts.bit * 60000);

    if(ws instanceof WebSocket) ws.send(JSON.stringify({ time }));
});

client.on('sub', (T) => {
    let time;
    let tier = tiers[T];

    switch(tier) {
        case 1:
            time = amounts['Tier1'] * 60000;
            break;
        case 2:
            time = amounts['Tier2'] * 60000;
            break;
        case 3:
            time = amounts['Tier3'] * 60000;
            break;
        default: break;
    }

    if(ws instanceof WebSocket) ws.send(JSON.stringify({ time }));
});

client.on('giftsub', (T, amount) => {
    let time;
    let tier = tiers[T];

    switch(tier) {
        case 1:
            time = (amounts['Tier1'] * 60000) * amount;
            break;
        case 2:
            time = (amounts['Tier2'] * 60000) * amount;
            break;
        case 3:
            time = (amounts['Tier3'] * 60000) * amount;
            break;
        default: break;
    }

    if(ws instanceof WebSocket) ws.send(JSON.stringify({ time }));
});

client.connect();