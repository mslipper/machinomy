import { PaymentChannel } from './payment_channel';
import Payment from './payment';
import ChannelContract from './channel_contract';
import { MachinomyOptions } from '../MachinomyOptions';
export default class PaymentValidation {
    private readonly payment;
    private readonly paymentChannel;
    private readonly channelContract;
    private readonly options;
    constructor(channelContract: ChannelContract, payment: Payment, paymentChannel: PaymentChannel, options: MachinomyOptions);
    isValid(): Promise<boolean>;
    private isValidIncrement();
    private isValidChannelValue();
    private isValidChannelId();
    private isValidPaymentValue();
    private isValidSender();
    private isPositive();
    private canClaim();
    private isAboveMinSettlementPeriod();
}
