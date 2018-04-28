import Serde from './serde';
export declare class AcceptTokenRequest {
    token: string;
    constructor(token: string);
}
export declare class AcceptTokenRequestSerde implements Serde<AcceptTokenRequest> {
    static instance: AcceptTokenRequestSerde;
    serialize(obj: AcceptTokenRequest): object;
    deserialize(data: any): AcceptTokenRequest;
}
