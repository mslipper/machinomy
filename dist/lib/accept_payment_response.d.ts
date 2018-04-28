import Serde from './serde';
export declare class AcceptPaymentResponse {
    token: string;
    constructor(token: string);
}
export declare class AcceptPaymentResponseSerde implements Serde<AcceptPaymentResponse> {
    static instance: AcceptPaymentResponseSerde;
    serialize(obj: AcceptPaymentResponse): object;
    deserialize(data: any): AcceptPaymentResponse;
}
