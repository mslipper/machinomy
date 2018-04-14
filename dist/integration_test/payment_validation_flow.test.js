"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const express = require("express");
const bodyParser = require("body-parser");
const index_1 = require("../index");
const expects_rejection_1 = require("../test/util/expects_rejection");
const expect = require('expect');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MACHINOMY_GETH_ADDR));
const sender = process.env.SENDER_ADDRESS;
const receiver = process.env.RECEIVER_ADDRESS;
describe('Payment validation flow', () => {
    const price = new BigNumber.BigNumber(web3.toWei(0.1, 'ether'));
    let hubPort;
    let hubInstance;
    let clientInstance;
    let hubServer;
    let serverListener;
    describe('minimum settlement period', () => {
        before((done) => {
            hubPort = randomPort();
            hubInstance = new index_1.default(receiver, web3, {
                databaseUrl: `nedb:///tmp/machinomy-hub-${Date.now()}`,
                minimumSettlementPeriod: 10
            });
            clientInstance = new index_1.default(sender, web3, {
                settlementPeriod: 0,
                databaseUrl: `nedb:///tmp/machinomy-client-${Date.now()}`
            });
            hubServer = express();
            hubServer.use(bodyParser.json());
            hubServer.use(bodyParser.urlencoded({ extended: false }));
            hubServer.post('/machinomy', async (req, res) => {
                try {
                    const body = await hubInstance.acceptPayment(req.body);
                    res.status(200).send(body);
                }
                catch (e) {
                    res.sendStatus(400);
                }
            });
            serverListener = hubServer.listen(hubPort, done);
        });
        after(async () => {
            await hubInstance.shutdown();
            await clientInstance.shutdown();
            serverListener.close();
        });
        it('should reject payments with a settlement period lower than the minimum', async () => {
            return expects_rejection_1.default(clientInstance.buy({
                receiver,
                price,
                gateway: `http://localhost:${hubPort}/machinomy`,
                meta: ''
            }));
        });
        it('should accept payments with a settlement period higher than the minimum', () => {
            clientInstance = new index_1.default(sender, web3, {
                settlementPeriod: 11,
                databaseUrl: `nedb:///tmp/machinomy-client-${Date.now()}`
            });
            return clientInstance.buy({
                receiver,
                price,
                gateway: `http://localhost:${hubPort}/machinomy`,
                meta: ''
            }).then((res) => {
                expect(res.token.length).toBeGreaterThan(0);
            });
        });
    });
});
function randomPort() {
    return 3000 + Math.floor(10000 * Math.random());
}
//# sourceMappingURL=payment_validation_flow.test.js.map