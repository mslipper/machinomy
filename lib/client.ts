import { EventEmitter } from 'events'
import { PaymentRequired, STATUS_CODES, Transport } from './transport'
import Payment, { PaymentSerde } from './payment'
import ChannelManager from './channel_manager'
import Serde from './serde'
import * as request from 'request'
import log from './util/log'
import fetcher from './util/fetch'

const LOG = log('Client')

export class AcceptPaymentRequest {
  payment: Payment

  constructor (payment: Payment) {
    this.payment = payment
  }
}

export class AcceptPaymentRequestSerde implements Serde<AcceptPaymentRequest> {
  static instance: AcceptPaymentRequestSerde = new AcceptPaymentRequestSerde()

  serialize (obj: AcceptPaymentRequest): object {
    return {
      payment: PaymentSerde.instance.serialize(obj.payment)
    }
  }

  deserialize (data: any): AcceptPaymentRequest {
    if (!data.payment) {
      throw new Error('Cannot deserialize payment request. Payment is missing.')
    }

    const payment = PaymentSerde.instance.deserialize(data.payment)
    return new AcceptPaymentRequest(payment)
  }
}

export class AcceptPaymentResponse {
  token: string

  constructor (token: string) {
    this.token = token
  }
}

export class AcceptPaymentResponseSerde implements Serde<AcceptPaymentResponse> {
  static instance: AcceptPaymentResponseSerde = new AcceptPaymentResponseSerde()

  serialize (obj: AcceptPaymentResponse): object {
    return {
      token: obj.token
    }
  }

  deserialize (data: any): AcceptPaymentResponse {
    if (!data.token) {
      throw new Error('Cannot deserialize payment response. Token is missing.')
    }

    return new AcceptPaymentResponse(data.token)
  }
}

export class AcceptTokenRequest {
  token: string

  constructor (token: string) {
    this.token = token
  }
}

export class AcceptTokenRequestSerde implements Serde<AcceptTokenRequest> {
  static instance: AcceptTokenRequestSerde = new AcceptTokenRequestSerde()

  serialize (obj: AcceptTokenRequest): object {
    return {
      token: obj.token
    }
  }

  deserialize (data: any): AcceptTokenRequest {
    if (!data.token) {
      throw new Error('Cannot deserialize token request. Token is missing.')
    }

    return new AcceptTokenRequest(data.token)
  }
}

export class AcceptTokenResponse {
  status: boolean

  constructor (status: boolean) {
    this.status = status
  }
}

export class AcceptTokenResponseSerde implements Serde<AcceptTokenResponse> {
  static instance: AcceptTokenResponseSerde = new AcceptTokenResponseSerde()

  serialize (obj: AcceptTokenResponse): object {
    return {
      status: obj.status
    }
  }

  deserialize (data: any): AcceptTokenResponse {
    if (data.status === undefined) {
      throw new Error('Cannot deserialize token response. Status is missing.')
    }

    return new AcceptTokenResponse(data.status)
  }
}

export default interface Client extends EventEmitter {
  doPreflight (uri: string): Promise<PaymentRequired>
  doPayment (payment: Payment, gateway: string): Promise<AcceptPaymentResponse>
  acceptPayment (req: AcceptPaymentRequest): Promise<AcceptPaymentResponse>
  doVerify (token: string, gateway: string): Promise<AcceptTokenResponse>
  acceptVerify (req: AcceptTokenRequest): Promise<AcceptTokenResponse>
}

export class ClientImpl extends EventEmitter implements Client {
  private static HEADER_PREFIX = 'paywall'

  private static REQUIRED_HEADERS = [
    'version',
    'address',
    'price',
    'gateway'
  ]

  private transport: Transport

  private channelManager: ChannelManager

  constructor (transport: Transport, channelManager: ChannelManager) {
    super()
    this.transport = transport
    this.channelManager = channelManager
  }

  doPreflight (uri: string): Promise<PaymentRequired> {
    this.emit('willPreflight')

    return this.transport.get(uri).then((res: request.RequestResponse) => {
      this.emit('didPreflight')

      switch (res.statusCode) {
        case STATUS_CODES.PAYMENT_REQUIRED:
        case STATUS_CODES.OK:
          return this.handlePaymentRequired(res)
        default:
          throw new Error('Received bad response from content server.')
      }
    })
  }

  async doPayment (payment: Payment, gateway: string): Promise<AcceptPaymentResponse> {
    this.emit('willSendPayment')

    LOG(`Attempting to send payment to ${gateway}. Sender: ${payment.sender} / Receiver: ${payment.receiver} / Amount: ${payment.price.toString()}`)

    const request = new AcceptPaymentRequest(payment)

    const res = await fetcher.fetch(gateway, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(AcceptPaymentRequestSerde.instance.serialize(request))
    })

    const resJson = await res.json()
    const deres = AcceptPaymentResponseSerde.instance.deserialize(resJson)
    LOG(`Successfully sent payment to ${gateway}.`)
    this.emit('didSendPayment')
    return deres
  }

  acceptPayment (req: AcceptPaymentRequest): Promise<AcceptPaymentResponse> {
    const payment = req.payment

    LOG(`Received payment request. Sender: ${payment.sender} / Receiver: ${payment.receiver}`)

    return this.channelManager.acceptPayment(payment)
      .then((token: string) => {
        LOG(`Accepted payment request. Sender: ${payment.sender} / Receiver: ${payment.receiver}`)
        return new AcceptPaymentResponse(token)
      })
  }

  async doVerify (token: string, gateway: string): Promise<AcceptTokenResponse> {
    this.emit('willVerifyToken')

    LOG(`Attempting to verify token with ${gateway}.`)

    const request = new AcceptTokenRequest(token)

    try {
      const res = await fetcher.fetch(gateway, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(AcceptTokenRequestSerde.instance.serialize(request))
      })

      const resJson = await res.json()

      const deres = AcceptTokenResponseSerde.instance.deserialize(resJson)
      LOG(`Successfully verified token with ${gateway}.`)
      this.emit('didVerifyToken')
      return deres
    } catch (e) {
      return new AcceptTokenResponse(false)
    }
  }

  acceptVerify (req: AcceptTokenRequest): Promise<AcceptTokenResponse> {
    return this.channelManager.verifyToken(req.token)
      .then((res: boolean) => new AcceptTokenResponse(res))
      .catch(() => new AcceptTokenResponse(false))
  }

  private handlePaymentRequired (res: request.RequestResponse): PaymentRequired {
    const headers = res.headers

    ClientImpl.REQUIRED_HEADERS.forEach((name: string) => {
      const header = `${ClientImpl.HEADER_PREFIX}-${name}`
      if (!headers[header]) {
        throw new Error(`Missing required header: ${header}`)
      }
    })

    return PaymentRequired.parse(headers)
  }
}
