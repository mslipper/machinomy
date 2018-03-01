import * as sinon from 'sinon'
import ChannelManager from '../lib/channel_manager'
import * as BigNumber from 'bignumber.js'
import { PaymentRequired, Transport } from '../lib/transport'
import { AcceptPaymentRequestSerde, AcceptPaymentResponse, AcceptTokenResponse, ClientImpl } from '../lib/client'
import expectsRejection from './util/expects_rejection'
import { PaymentSerde } from '../lib/payment'
import fetcher from '../lib/util/fetch'

const expect = require('expect')

describe('ClientImpl', () => {
  let transport: Transport

  let channelManager: ChannelManager

  let client: ClientImpl

  beforeEach(() => {
    transport = {} as Transport
    channelManager = {} as ChannelManager
    client = new ClientImpl(transport, channelManager)
  })

  describe('doPreflight', () => {
    it('returns payment required when a payment required or OK response comes back', () => {
      return Promise.all([200, 402].map((statusCode: number) => {
        transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
          statusCode: 402,
          headers: {
            'paywall-version': '1.0',
            'paywall-address': '0x1234',
            'paywall-price': '1000',
            'paywall-gateway': 'http://honkhost:8080/machinomy',
            'paywall-meta': 'hello',
            'paywall-token-address': '0xbeef'
          }
        })

        return client.doPreflight('http://honkhost:1234/site').then((res: PaymentRequired) => {
          expect(res.receiver).toBe('0x1234')
          expect(res.price).toEqual(new BigNumber.BigNumber(1000))
          expect(res.gateway).toBe('http://honkhost:8080/machinomy')
          expect(res.meta).toBe('hello')
          expect(res.contractAddress).toBe('0xbeef')
        })
      }))
    })

    it('throws an error for any other status code', () => {
      transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
        statusCode: 300
      })

      return expectsRejection(client.doPreflight('http://honkhost:1234/site'))
    })

    it('throws an error when required headers don\'t show up', () => {
      const prefixes = [
        'version',
        'address',
        'price',
        'gateway'
      ]

      const headers = {
        'paywall-version': '1.0',
        'paywall-address': '0x1234',
        'paywall-price': '1000',
        'paywall-gateway': 'http://honkhost:8080/machinomy',
        'paywall-meta': 'hello',
        'paywall-token-address': '0xbeef'
      }

      return Promise.all(prefixes.map((prefix: string) => {
        const badHeaders: any = {
          ...headers
        }

        delete badHeaders[`paywall-${prefix}`]

        transport.get = sinon.stub().withArgs('http://honkhost:1234/site').resolves({
          statusCode: 402,
          headers: badHeaders
        })

        return expectsRejection(client.doPreflight('http://honkhost:1234/site'))
      }))
    })
  })

  describe('doPayment', () => {
    let paymentJson: any

    let post: sinon.SinonStub

    beforeEach(() => {
      paymentJson = {
        channelId: '0x1234',
        value: '1000',
        sender: '0xbeef',
        receiver: '0xdead',
        price: '100',
        channelValue: '1000',
        v: 27,
        r: '0x000000000000000000000000000000000000000000000000000000000000000a',
        s: '0x000000000000000000000000000000000000000000000000000000000000000a',
        contractAddress: '0xab',
        token: '0x123'
      }

      post = sinon.stub(fetcher, 'fetch')
      post.withArgs('gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: sinon.match.string
      }).resolves({
        json: () => Promise.resolve({ token: 'beep' })
      })
    })

    afterEach(() => {
      post.restore()
    })

    it('returns an AcceptPaymentResponse on success', () => {
      const payment = PaymentSerde.instance.deserialize(paymentJson)

      return client.doPayment(payment, 'gateway').then((res: AcceptPaymentResponse) => {
        expect(res.token).toBe('beep')
      })
    })

    it('emits willSendPayment and didSendPayment', () => {
      const payment = PaymentSerde.instance.deserialize(paymentJson)
      const will = sinon.stub()
      const did = sinon.stub()

      client.addListener('willSendPayment', will)
      client.addListener('didSendPayment', did)

      return client.doPayment(payment, 'gateway').then((res: AcceptPaymentResponse) => {
        expect(will.called).toBe(true)
        expect(did.called).toBe(true)
      })
    })

    it('throws an error if deserialization fails', () => {
      const payment = PaymentSerde.instance.deserialize(paymentJson)

      post.withArgs('gateway', {
        json: true,
        body: {
          payment: paymentJson
        }
      }).resolves({
        falafels: 'are good'
      })

      return expectsRejection(client.doPayment(payment, 'gateway'))
    })
  })

  describe('acceptPayment', () => {
    it('returns an AcceptPaymentResponse from the channel manager', () => {
      const req = AcceptPaymentRequestSerde.instance.deserialize({
        payment: {
          channelId: '0x1234',
          value: '1000',
          sender: '0xbeef',
          receiver: '0xdead',
          price: '100',
          channelValue: '1000',
          v: 27,
          r: '0xa',
          s: '0xb',
          contractAddress: '0xab',
          token: '0x123'
        }
      })

      channelManager.acceptPayment = sinon.stub().withArgs(req.payment).resolves('token')

      return client.acceptPayment(req).then((res: AcceptPaymentResponse) => {
        expect(res.token).toBe('token')
      })
    })
  })

  describe('doVerify', () => {
    let post: sinon.SinonStub

    beforeEach(() => {
      post = sinon.stub(fetcher, 'fetch')
      post.withArgs('gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token: 'token' })
      })
    })

    afterEach(() => {
      post.restore()
    })

    it('returns an AcceptTokenResponse if the token is accepted', () => {
      post.resolves({
        json: () => Promise.resolve({ status: true })
      })

      return client.doVerify('token', 'gateway').then((res: AcceptTokenResponse) => {
        expect(res.status).toBe(true)
      })
    })

    it('returns an AcceptTokenResponse if the token is rejected', () => {
      post.resolves({
        status: false
      })

      return client.doVerify('token', 'gateway').then((res: AcceptTokenResponse) => {
        expect(res.status).toBe(false)
      })
    })

    it('returns a false AcceptTokenResponse if an error occurs', () => {
      post.rejects()

      return client.doVerify('token', 'gateway').then((res: AcceptTokenResponse) => {
        expect(res.status).toBe(false)
      })
    })
  })

  describe('acceptVerify', () => {
    it('returns an AcceptTokenResponse based on the request', () => {
      channelManager.verifyToken = sinon.stub().withArgs('token').resolves(true)

      return client.acceptVerify({ token: 'token' }).then((res: AcceptTokenResponse) => {
        expect(res.status).toBe(true)
      })
    })
  })
})
