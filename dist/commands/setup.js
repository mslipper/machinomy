"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import machinomy from '../lib/buy'
const config = require("../lib/configuration");
const fs = require("fs");
const prompt = require("prompt");
const setup = (command) => {
    let namespace = command.namespace || 'sender';
    let baseDirPath = config.baseDirPath();
    if (!fs.existsSync(baseDirPath)) {
        fs.mkdirSync(baseDirPath);
    }
    let configuration;
    try {
        configuration = config.configurationOptions();
    }
    catch (ex) {
        configuration = {};
    }
    prompt.message = null;
    prompt.colors = false;
    prompt.start();
    console.log('Please, for a command line client insert you Ethereum account address, and optionally a password');
    console.log('For ' + namespace);
    prompt.get(['account', 'password'], function (err, result) {
        if (err) {
            throw err;
        }
        configuration[namespace] = result;
        console.log('');
        console.log('Full configuration:');
        console.log(configuration);
        let configurationString = JSON.stringify(configuration, null, 4);
        fs.writeFileSync(config.configFilePath(), configurationString);
    });
};
exports.default = setup;
//# sourceMappingURL=setup.js.map