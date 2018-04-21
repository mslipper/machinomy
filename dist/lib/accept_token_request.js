"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AcceptTokenRequest {
    constructor(token) {
        this.token = token;
    }
}
exports.AcceptTokenRequest = AcceptTokenRequest;
class AcceptTokenRequestSerde {
    serialize(obj) {
        return {
            token: obj.token
        };
    }
    deserialize(data) {
        if (!data.token) {
            throw new Error('Cannot deserialize token request. Token is missing.');
        }
        return new AcceptTokenRequest(data.token);
    }
}
AcceptTokenRequestSerde.instance = new AcceptTokenRequestSerde();
exports.AcceptTokenRequestSerde = AcceptTokenRequestSerde;
//# sourceMappingURL=accept_token_request.js.map