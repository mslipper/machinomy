"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BigNumber = require("bignumber.js");
const payment_1 = require("./lib/payment");
const container_1 = require("./lib/container");
const client_1 = require("./lib/client");
const services_1 = require("./lib/services");
/**
 * Machinomy is a library for micropayments in Ether (and ERC20 tokens) over HTTP.
 * Machinomy provides API to send and receive a minuscule amount of money instantly.
 * Core method is [buy]{@link Machinomy.buy}. The method does all the heavy lifting providing an easy interface
 * for micropayments.
 *
 * NB. All monetary values below are denominated in Wei, including: [buy]{@link Machinomy.buy} and
 * [deposit]{@link Machinomy.deposit} methods.
 *
 * You can find ES5 example in this {@link https://github.com/machinomy/machinomy/tree/master/examples folder} of the project.
 * @example <caption>Buying with Machinomy (TypeScript)</caption>
 * <pre><code>import Machinomy from 'machinomy'
 * import Web3 = require('web3')
 *
 * const sender = '0x5bf66080c92b81173f470e25f9a12fc146278429'
 * const provider = new Web3.providers.HttpProvider("http://localhost:8545")
 * let web3 = new Web3(provider)
 *
 * let machinomy = new Machinomy(sender, web3, { engine: 'nedb' })
 *
 * const price = Number(web3.toWei(1, 'ether'))
 * const receiver = '0xebeab176c2ca2ae72f11abb1cecad5df6ccb8dfe'
 * const result = await machinomy.buy({
 *   receiver: receiver,
 *   price: price,
 *   gateway: 'http://localhost:3001/machinomy'
 *  })
 * let channelId = result.channelId
 * await machinomy.close(channelId)
 * // wait till the receiver claims the money during settling period
 * await machinomy.close(channelId) // and get the change if he/she does not
 * </code></pre>
 */
class Machinomy {
    /**
     * Create an instance of Machinomy.
     *
     * @example <caption>Instantiating Machinomy.</caption>
     * <pre><code>const sender = '0x5bf66080c92b81173f470e25f9a12fc146278429'
     * const provider = new Web3.providers.HttpProvider("http://localhost:8545")
     * let web3 = new Web3(provider)
     *
     * let machinomy = new Machinomy(sender, web3, { engine: 'nedb' })</code></pre>
     *
     * @param account - Ethereum account address that sends the money. Make sure it is managed by Web3 instance passed as `web3` param.
     * @param web3 - Prebuilt web3 instance that manages the account and signs payments.
     * @param options - Options object
     */
    constructor(account, web3, options) {
        options.closeOnInvalidPayment = typeof options.closeOnInvalidPayment === 'boolean' ? options.closeOnInvalidPayment : true;
        const serviceRegistry = services_1.default();
        serviceRegistry.bind('Web3', () => web3);
        serviceRegistry.bind('MachinomyOptions', () => options);
        serviceRegistry.bind('account', () => account);
        serviceRegistry.bind('namespace', () => 'shared');
        this.serviceContainer = new container_1.Container(serviceRegistry);
        this.channelManager = this.serviceContainer.resolve('ChannelManager');
        this.paymentsDao = this.serviceContainer.resolve('PaymentsDatabase');
        this.client = this.serviceContainer.resolve('Client');
        this.account = account;
        this.engine = this.serviceContainer.resolve('Engine');
    }
    /**
     * Entrypoint for a purchasing.
     *
     * Wnen you `buy` for the first time from the same receiver, the method opens a channel with a deposit equal to `price`✕10.
     * Next method call forms a payment and sends it via http to `gateway` url.
     *
     * The method then returns a token and channel id, in form of {@link BuyResult}.
     *
     * @example
     * <pre><code>machinomy.buy({
     *   receiver: receiver,
     *   price: 100,
     *   gateway: 'http://localhost:3001/machinomy'
     *  })
     * </code></pre>
     */
    async buy(options) {
        if (!options.gateway) {
            throw new Error('gateway must be specified.');
        }
        const payment = await this.nextPayment(options);
        const res = await this.client.doPayment(payment, options.gateway);
        return { token: res.token, channelId: payment.channelId };
    }
    async payment(options) {
        const payment = await this.nextPayment(options);
        return { payment: payment_1.PaymentSerde.instance.serialize(payment) };
    }
    async pry(uri) {
        return this.client.doPreflight(uri);
    }
    buyUrl(uri) {
        return this.client.doPreflight(uri).then((req) => this.buy({
            receiver: req.receiver,
            price: req.price,
            gateway: req.gateway,
            meta: req.meta,
            contractAddress: req.contractAddress
        }));
    }
    /**
     * Put more money into the channel.
     *
     * @example
     * <pre><code>
     * let channelId = '0x0bf080aeb3ed7ea6f9174d804bd242f0b31ff1ea24800344abb580cd87f61ca7'
     * machinomy.deposit(channelId, web3.toWei(1, "ether").toNumber(())) // Put 1 Ether more
     * </code></pre>
     *
     * @param channelId - Channel id.
     * @param value - Size of deposit in Wei.
     */
    async deposit(channelId, value) {
        const _value = new BigNumber.BigNumber(value);
        return this.channelManager.deposit(channelId, _value);
    }
    async open(receiver, value, channelId) {
        const _value = new BigNumber.BigNumber(value);
        return this.channelManager.openChannel(this.account, receiver, new BigNumber.BigNumber(0), _value, channelId);
    }
    /**
     * Returns the list of opened channels.
     */
    channels() {
        return this.channelManager.openChannels();
    }
    openChannels() {
        return this.channels();
    }
    settlingChannels() {
        return this.channelManager.settlingChannels();
    }
    channelById(channelId) {
        return this.channelManager.channelById(channelId);
    }
    /**
     * Share the money between sender and reciver according to payments made.
     *
     * For example a channel was opened with 10 Ether. Sender makes 6 purchases, 1 Ether each.
     * Total value transferred is 6 Ether.
     * If a party closes the channel, the money deposited to the channel are split.
     * The receiver gets 6 Ether. 4 unspent Ethers return to the sender.
     *
     * A channel can be closed in two ways, according to what party initiates that.
     * The method nicely abstracts over that, so you do not need to know what is really going on under the hood.
     * For more details on how payment channels work refer to a website.
     */
    async close(channelId) {
        return this.channelManager.closeChannel(channelId);
    }
    /**
     * Save payment into the storage and return an id of the payment. The id can be used by {@link Machinomy.paymentById}.
     */
    acceptPayment(req) {
        return this.client.acceptPayment(client_1.AcceptPaymentRequestSerde.instance.deserialize(req));
    }
    /**
     * Return information about the payment by id.
     */
    paymentById(id) {
        return this.paymentsDao.findByToken(id);
    }
    acceptToken(req) {
        return this.client.acceptVerify(req);
    }
    shutdown() {
        return this.engine.close();
    }
    async nextPayment(options) {
        const price = new BigNumber.BigNumber(options.price);
        const channel = await this.channelManager.requireOpenChannel(this.account, options.receiver, price);
        return this.channelManager.nextPayment(channel.channelId, price, options.meta || '');
    }
}
exports.default = Machinomy;
//# sourceMappingURL=index.js.map