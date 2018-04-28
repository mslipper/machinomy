"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AcceptTokenResponse {
    constructor(status) {
        this.status = status;
    }
}
exports.AcceptTokenResponse = AcceptTokenResponse;
class AcceptTokenResponseSerde {
    serialize(obj) {
        return {
            status: obj.status
        };
    }
    deserialize(data) {
        if (data.status === undefined) {
            throw new Error('Cannot deserialize token response. Status is missing.');
        }
        return new AcceptTokenResponse(data.status);
    }
}
AcceptTokenResponseSerde.instance = new AcceptTokenResponseSerde();
exports.AcceptTokenResponseSerde = AcceptTokenResponseSerde;
//# sourceMappingURL=accept_token_response.js.map