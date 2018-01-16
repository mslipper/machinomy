import Web3 = require('web3')
import * as util from 'ethereumjs-util'
import { PaymentChannel } from './channel'
import { PaymentRequired } from './transport'
import { Broker, TokenBroker, sign, paymentDigest } from '@machinomy/contracts'
import BigNumber from './bignumber'

export interface PaymentJSON {
  channelId: string
  sender: string
  receiver: string
  price: BigNumber
  value: BigNumber
  channelValue: BigNumber
  v: number|string
  r: string
  s: string
  meta: string
  contractAddress?: string
  token: string | undefined
}

export function getNetwork (web3: Web3): Promise<string> {
  return new Promise((resolve, reject) => {
    web3.version.getNetwork((error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })
}

export default class Payment {
  channelId: string
  sender: string
  receiver: string
  price: BigNumber
  value: BigNumber
  channelValue: BigNumber
  v: number
  r: string
  s: string
  meta: string
  contractAddress: string | undefined
  token: string | undefined

  constructor (options: PaymentJSON) {
    this.channelId = options.channelId
    this.sender = options.sender
    this.receiver = options.receiver
    this.price = options.price
    this.value = options.value
    this.channelValue = options.channelValue
    this.v = Number(options.v)
    this.r = options.r
    this.s = options.s
    this.meta = options.meta
    this.contractAddress = options.contractAddress
    this.token = options.token
  }

  // TODO use it
  static async isValid (web3: Web3, payment: Payment, paymentChannel: PaymentChannel): Promise<boolean> {
    let validIncrement = (paymentChannel.spent.plus(payment.price)).lessThanOrEqualTo(paymentChannel.value)
    let validChannelValue = paymentChannel.value.equals(payment.channelValue)
    let validChannelId = paymentChannel.channelId === payment.channelId
    let validPaymentValue = paymentChannel.value.lessThanOrEqualTo(payment.channelValue)
    let validSender = paymentChannel.sender === payment.sender
    let isPositive = payment.value.greaterThanOrEqualTo(new BigNumber(0)) && payment.price.greaterThanOrEqualTo(new BigNumber(0))
    let deployed
    if (paymentChannel.contractAddress) {
      deployed = await TokenBroker.deployed(web3.currentProvider)
    } else {
      deployed = await Broker.deployed(web3.currentProvider)
    }
    let chainId = await getNetwork(web3)
    let _paymentDigest = paymentDigest(paymentChannel.channelId, payment.value, deployed.address, Number(chainId))

    let signature = await sign(web3, paymentChannel.sender, _paymentDigest)
    let validSignature = signature.v === payment.v &&
      util.bufferToHex(signature.r) === payment.r &&
      util.bufferToHex(signature.s) === payment.s
    return validIncrement &&
      validChannelValue &&
      validPaymentValue &&
      validSender &&
      validChannelId &&
      validSignature &&
      isPositive
  }

  /**
   * Build {Payment} based on PaymentChannel and monetary value to send.
   */
  static async fromPaymentChannel (web3: Web3, paymentChannel: PaymentChannel, paymentRequired: PaymentRequired, override?: boolean): Promise<Payment> {
    let value = paymentRequired.price.plus(paymentChannel.spent)
    if (override) { // FIXME
      value = paymentRequired.price
    }
    let deployed
    if (paymentChannel.contractAddress) {
      deployed = await TokenBroker.deployed(web3.currentProvider)
    } else {
      deployed = await Broker.deployed(web3.currentProvider)
    }
    let chainId = await getNetwork(web3)
    let _paymentDigest = paymentDigest(paymentChannel.channelId, value, deployed.address, Number(chainId))

    let signature = await sign(web3, paymentChannel.sender, _paymentDigest)
    return new Payment({
      channelId: paymentChannel.channelId,
      sender: paymentChannel.sender,
      receiver: paymentChannel.receiver,
      price: paymentRequired.price,
      value,
      channelValue: paymentChannel.value,
      v: signature.v,
      r: '0x' + signature.r.toString('hex'),
      s: '0x' + signature.s.toString('hex'),
      meta: paymentRequired.meta,
      contractAddress: paymentChannel.contractAddress,
      token: undefined
    })
  }

  static serialize (payment: Payment): object {
    return {
      channelId: payment.channelId.toString(),
      value: payment.value.toString(),
      sender: payment.sender,
      receiver: payment.receiver,
      price: payment.price.toString(),
      channelValue: payment.channelValue.toString(),
      v: Number(payment.v),
      r: payment.r,
      s: payment.s,
      contractAddress: payment.contractAddress,
      token: payment.token
    }
  }
}
