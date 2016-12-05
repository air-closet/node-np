'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var CONST = {
    VERSION: '2.00',
    UTF8: 'utf8',
    HTTP: {
        GET: 'get',
        POST: 'post'
    },
    RESPONSE: {
        OK: 'OK',
        NG: 'NG'
    },
    PATH: {
        HEAD: '/config/head.xml',
        CONF: '/config/config.json'
    },
    ERROR: {
        CLIENT: 'required wsdl, terminalId, spCode.'
    },
    LOG: {
        HEAD: '---------- HEAD -----------',
        BODY: '---------- BODY -----------',
        METHOD: '========== METHOD ========',
        PARAM: '---------- ARGS ----------',
        DELIMITER: '---------------------------'
    }
};

exports.default = CONST;
module.exports = exports['default'];