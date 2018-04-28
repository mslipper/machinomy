import Serde from './serde';
import { default as Payment } from './payment';
import { HasTypeField } from './has_type_field';
export declare class AcceptPaymentRequest {
    payment: Payment;
    purchaseMeta: HasTypeField;
    constructor(payment: Payment, purchaseMeta: HasTypeField);
}
export declare class AcceptPaymentRequestSerde implements Serde<AcceptPaymentRequest> {
    static instance: AcceptPaymentRequestSerde;
    serialize(obj: AcceptPaymentRequest): object;
    deserialize(data: any): AcceptPaymentRequest;
}
