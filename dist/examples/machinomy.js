"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("../lib/configuration");
const Web3 = require("web3");
const index_1 = require("../index");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
let sender = '0x0108d76118d97b88aa40167064cb242fa391effa';
let receiver = '0x3155694d7558eec974cfe35eaa3c2c7bcebb793f';
let getBalance = async (web3, account) => {
    return web3.eth.getBalance(account);
};
let provider = configuration.currentProvider();
let web3 = new Web3(provider);
let machinomyHub = new index_1.default(receiver, web3, { databaseUrl: 'nedb://./hub' });
let hub = express();
hub.use(bodyParser.json());
hub.use(bodyParser.urlencoded({ extended: false }));
hub.post('/machinomy', async (req, res, next) => {
    let body = await machinomyHub.acceptPayment(req.body);
    res.status(200).send(body);
});
let checkBalance = async (message, web3, sender, cb) => {
    console.log('----------');
    console.log(message);
    let balanceBefore = await getBalance(web3, sender);
    console.log('Balance before', web3.fromWei(balanceBefore, 'mwei').toString());
    let result = await cb();
    let balanceAfter = await getBalance(web3, sender);
    console.log('Balance after', web3.fromWei(balanceAfter, 'mwei').toString());
    let diff = balanceBefore.minus(balanceAfter);
    console.log('Diff', web3.fromWei(diff, 'mwei').toString());
    return result;
};
let port = 3001;
let server = hub.listen(port, async () => {
    const price = 1000000;
    let machinomy = new index_1.default(sender, web3, { settlementPeriod: 0, databaseUrl: 'nedb://./client' });
    let message = 'This is first buy:';
    let resultFirst = await checkBalance(message, web3, sender, async () => {
        return machinomy.buy({
            receiver: receiver,
            price: price,
            gateway: 'http://localhost:3001/machinomy',
            meta: 'metaexample'
        }).catch((e) => {
            console.log(e);
        });
    });
    message = 'This is second buy:';
    let resultSecond = await checkBalance(message, web3, sender, async () => {
        return machinomy.buy({
            receiver: receiver,
            price: price,
            gateway: 'http://localhost:3001/machinomy',
            meta: 'metaexample'
        }).catch((e) => {
            console.log(e);
        });
    });
    let channelId = resultSecond.channelId;
    message = 'Deposit:';
    await checkBalance(message, web3, sender, async () => {
        await machinomy.deposit(channelId, price);
    });
    message = 'First close:';
    await checkBalance(message, web3, sender, async () => {
        await machinomy.close(channelId);
    });
    message = 'Second close:';
    await checkBalance(message, web3, sender, async () => {
        await machinomy.close(channelId);
    });
    message = 'Once more buy';
    let resultThird = await checkBalance(message, web3, sender, async () => {
        return machinomy.buy({
            receiver: receiver,
            price: price,
            gateway: 'http://localhost:3001/machinomy',
            meta: 'metaexample'
        }).catch((e) => {
            console.log(e);
        });
    });
    message = 'Claim by reciver';
    await checkBalance(message, web3, sender, async () => {
        await machinomyHub.close(resultThird.channelId);
    });
    console.log('ChannelId after first buy:', resultFirst.channelId);
    console.log('ChannelId after second buy:', resultSecond.channelId);
    console.log('ChannelId after once more buy:', resultThird.channelId);
    server.close();
    try {
        fs.unlinkSync('client');
    }
    catch (error) {
        console.log(error);
    }
    try {
        fs.unlinkSync('hub');
    }
    catch (error) {
        console.log(error);
    }
});
//# sourceMappingURL=machinomy.js.map