"use strict";
/**
 * Start this file by
 *
 * node server.js
 *
 * The script runs 3 core endpoints.
 * http://localhost:3000/content provides an example of the paid content.
 * http://localhost:3001/machinomy accepts payment.
 * http://localhost:3001/verify/:token verifies token that /machinomy generates.
 *
 * The main use case is to buy content:
 *
 * $ machinomy buy http://localhost:3000/content
 *
 * The command shows the bought content on console.
 *
 * Then you can see channels:
 *
 * $ machinomy channels
 *
 * And if you wants to close channel, call `/claim` endpoint via curl:
 *
 * $ curl -X POST http://localhost:3001/claim/:channeId
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const Web3 = require("web3");
const index_1 = require("../index");
const bodyParser = require("body-parser");
const accept_token_request_1 = require("../lib/accept_token_request");
const payment_channel_1 = require("../lib/payment_channel");
let fetch = require('whatwg-fetch').fetch;
/**
 * Account that receives payments.
 */
let receiver = '0x3155694d7558eec974cfe35eaa3c2c7bcebb793f';
/**
 * Geth must be run on local machine, or use another web3 provider.
 */
let provider = new Web3.providers.HttpProvider(process.env.MACHINOMY_GETH_ADDR);
let web3 = new Web3(provider);
/**
 * Create machinomy instance that provides API for accepting payments.
 */
let machinomy = new index_1.default(receiver, web3, { databaseUrl: 'mongodb://localhost:27017/machinomy' });
let hub = express();
hub.use(bodyParser.json());
hub.use(bodyParser.urlencoded({ extended: false }));
/**
 * Recieve an off-chain payment issued by `machinomy buy` command.
 */
hub.post('/machinomy', async (req, res, next) => {
    const body = await machinomy.acceptPayment(req.body);
    res.status(202).header('Paywall-Token', body.token).send(body);
});
/**
 * Verify the token that `/machinomy` generates.
 */
hub.get('/verify/:token', (req, res, next) => {
    let token = req.params.token;
    machinomy.acceptToken(accept_token_request_1.AcceptTokenRequestSerde.instance.deserialize({
        token
    })).then(() => res.status(200).send({ status: 'ok' }))
        .catch(() => res.status(400).send({ status: 'token is invalid' }));
});
hub.get('/channels', async (req, res, next) => {
    const channels = await machinomy.channels();
    res.status(200).send(channels.map(payment_channel_1.PaymentChannelSerde.instance.serialize));
});
hub.get('/claim/:channelid', async (req, res, next) => {
    try {
        let channelId = req.params.channelid;
        await machinomy.close(channelId);
        res.status(200).send('Claimed');
    }
    catch (error) {
        res.status(404).send('No channel found');
        console.log(error);
    }
});
let port = 3001;
hub.listen(port, function () {
    console.log('HUB is ready on port ' + port);
});
let app = express();
let paywallHeaders = () => {
    let headers = {};
    headers['Paywall-Version'] = '0.0.3';
    headers['Paywall-Price'] = '1000';
    headers['Paywall-Address'] = receiver;
    headers['Paywall-Gateway'] = 'http://localhost:3001/machinomy';
    return headers;
};
/**
 * Example of serving a paid content. You can buy it with `machinomy buy http://localhost:3000/content` command.
 */
app.get('/content', async (req, res, next) => {
    let reqUrl = 'http://localhost:3001/verify';
    let content = req.get('authorization');
    if (content) {
        let token = content.split(' ')[1];
        let response = await fetch(reqUrl + '/' + token);
        let json = await response.json();
        let status = json.status;
        if (status === 'ok') {
            res.send('Thank you for your purchase');
        }
        else {
            res.status(402).set(paywallHeaders()).send('Content is not avaible');
        }
    }
    else {
        res.status(402).set(paywallHeaders()).send('Content is not avaible');
    }
});
let portApp = 3000;
app.listen(portApp, function () {
    console.log('Content proveder is ready on ' + portApp);
});
//# sourceMappingURL=server.js.map