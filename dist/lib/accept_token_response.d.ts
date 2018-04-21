import Serde from './serde';
export declare class AcceptTokenResponse {
    status: boolean;
    constructor(status: boolean);
}
export declare class AcceptTokenResponseSerde implements Serde<AcceptTokenResponse> {
    static instance: AcceptTokenResponseSerde;
    serialize(obj: AcceptTokenResponse): object;
    deserialize(data: any): AcceptTokenResponse;
}
