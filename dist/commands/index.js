"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var commander = require("commander");
var homedir = require("homedir");
var setup_1 = require("./setup");
var buy_1 = require("./buy");
var pry_1 = require("./pry");
var channels_1 = require("./channels");
var close_1 = require("./close");
var configuration_1 = require("./configuration");
var PACKAGE_PATH = path.resolve(__dirname, '..', 'package.json');
var PACKAGE = JSON.parse(fs.readFileSync(PACKAGE_PATH).toString());
var BASE_DIR = '.machinomy';
var CONFIGURATION_FILE = 'config.json';
var baseDirPath = function () {
    return path.resolve(path.join(homedir(), BASE_DIR));
};
var ensureBaseDirPresent = function () {
    if (!fs.existsSync(baseDirPath())) {
        fs.mkdirSync(baseDirPath());
    }
};
var canCreateDatabase = function () {
    try {
        fs.accessSync(baseDirPath(), fs.constants.R_OK | fs.constants.W_OK);
        return true;
    }
    catch (ex) {
        return false;
    }
};
var configFilePath = function () {
    return path.join(baseDirPath(), CONFIGURATION_FILE);
};
var canReadConfig = function () {
    try {
        fs.accessSync(configFilePath(), fs.constants.R_OK);
        return true;
    }
    catch (ex) {
        return false;
    }
};
/**
 * @returns {object}
 */
var configurationOptions = function () {
    return JSON.parse(fs.readFileSync(configFilePath(), 'utf8'));
};
var canParseConfig = function () {
    try {
        configurationOptions();
        return true;
    }
    catch (ex) {
        return false;
    }
};
var ensure = function (command) {
    return function () {
        ensureBaseDirPresent();
        if (!canCreateDatabase()) {
            console.error('Can not create database file in ' + baseDirPath() + '. Please, check if one can create a file there.');
        }
        else if (!canReadConfig()) {
            console.error('Can not read configuration file. Please, check if it exists, or run `machinomy setup` command for an initial configuration');
        }
        else if (!canParseConfig()) {
            console.error('Can not parse configuration file. Please, ');
        }
        else {
            command.apply(null, arguments);
        }
    };
};
var main = function (args) {
    var version = PACKAGE.name + ' v' + PACKAGE.version;
    var parser = commander
        .version(version)
        .option('-P, --password [password]', 'password to unlock the account');
    parser.command('buy <uri>')
        .description('buy a resource at <uri>')
        .action(ensure(buy_1.default));
    parser.command('pry <uri>')
        .description('see cost of a resource at <uri>')
        .action(ensure(pry_1.default));
    parser.command('channels')
        .option('-n, --namespace [value]', 'find channels under namespace [sender]')
        .description('show open/closed channels')
        .action(ensure(channels_1.default));
    parser.command('close <channelId>')
        .option('-n, --namespace [value]', 'find channels under namespace [sender]')
        .description('close the channel')
        .action(ensure(close_1.default));
    parser.command('configuration')
        .alias('config')
        .option('-n, --namespace [value]', 'use snamespace [sender]')
        .description('display configuration')
        .action(ensure(configuration_1.default));
    parser.command('setup')
        .description('initial setup')
        .option('-n, --namespace [value]', 'use namespace [sender]')
        .action(setup_1.default);
    parser.parse(args);
};
module.exports = {
    main: main
};
//# sourceMappingURL=index.js.map