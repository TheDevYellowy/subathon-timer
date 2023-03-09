const { WebSocket } = require('ws');
const { EventEmitter } = require('node:events');

const { post, usernameToId } = require('./api');
const channel = require(`../config.json`).channel;

const td = new TextDecoder();

class EventSub extends EventEmitter {
    constructor() {
        super();

        /** @type {?WebSocket} */
        this.connection = null;
        this.connectedAt = null;
        this.id = null;
        this.userId = null;
    }

    connect() {
        if(this.connection?.readyState === WebSocket.OPEN) return Promise.resolve();

        const connURL = 'wss://eventsub-beta.wss.twitch.tv/ws';
        return new Promise((resolve, reject) => {
            this.connectedAt = Date.now();

            const ws = (this.connection = new WebSocket(connURL));

            ws.onopen = this.onOpen.bind(this);
            ws.onmessage = this.onMessage.bind(this);
        })
    }

    /** @private */
    onOpen() {
        this.debug(`[CONNECTED] took ${Date.now() - this.connectedAt}ms`);
    }

    /** @private */
    onMessage({ data }) {
        let raw;
        if(data instanceof ArrayBuffer) data = new Uint8Array(data);
        raw = data;
        if(typeof raw !== 'string') raw = td.decode(raw);
        let packet = JSON.parse(raw);
        this.emit('raw', packet);

        this.onPacket(packet);
    }

    /** @private */
    async onPacket(packet) {
        if(!packet) {
            this.debug(`Recieved broken packet: ${packet}`);
            return;
        }

        if(packet.metadata.message_type == 'session_welcome') {
            this.id = packet.payload.session.id;
            this.userId = await usernameToId(channel);
            [
                {name: 'channel.cheer', version: '1', condition: { 'broadcaster_user_id': this.userId }, transport: {method: 'websocket', session_id: this.id}},
                {name: 'channel.subscribe', version: '1', condition: { 'broadcaster_user_id': this.userId }, transport: {method: 'websocket', session_id: this.id}},
                {name: 'channel.subscription.gift', version: '1', condition: { 'broadcaster_user_id': this.userId }, transport: {method: 'websocket', session_id: this.id}},
            ].forEach(async body => await this.subscribe(body));
        }
        if(packet.metadata.message_type == 'session_reconnect') {
            this.connection = new WebSocket(packet.payload.session.reconnect_url);
        }

        const event = packet.metadata?.subscription_type;
        const data = packet?.payload?.event
        if(event) this.debug(`[EVENTS] Recieved ${event} event`);
        switch(event) {
            case 'channel.cheer':
                this.emit('cheer', data.bits);
                break;
            case 'channel.subscribe':
                if(data.is_gift) return;
                this.emit('sub', data.tier);
                break;
            case 'channel.subscription.gift':
                this.emit('giftsub', data.tier, data.total);
                break;
            default: return;
        }
    }

    /**
     * @typedef {Object} subscribeBody 
     * @property {string} type
     * @property {string} version
     * @property {Object.<string, string>} conditions
     * @property {Object.<string, string>} transport
     */

    /**
     * Subscribe to an event
     * @param {string} event The event name you want to connect to
     * @param {number} v The version the event is on
     * @param {subscribeBody} body
     * @returns {boolean}
     * 
     * @private
     */
    async subscribe(body) {
        const headers = {
            "Content-Type": "application/json"
        }

        body = JSON.stringify(body);

        this.debug(`[SUBSCRIBE] creating a event subscription for the following event ${body.type}`);

        let res = await post('eventsub/subscriptions', headers, body);

        this.debug(`[SUBSCRIBE] request returned with a status of ${res.status}`);

        if(res.status == 202) return true;
        else if(res.status == 400) return console.log(await res.json());
        else return false;
    }

    debug(message) {
        this.emit('debug', message);
    }
}

module.exports = EventSub;