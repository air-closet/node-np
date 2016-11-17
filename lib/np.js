'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _underscore = require('underscore');

var _underscore2 = require('underscore.string');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GET = 'get';
var POST = 'post';
var HEAD_PATH = '/config/head.xml';
var CONF_PATH = '/config/config.json';
var VERSION = '2.00';
var log = function log(str) {
    return console.log(str);
};

var NP = function () {
    function NP() {
        _classCallCheck(this, NP);

        this._confRoot = process.cwd();
    }

    _createClass(NP, [{
        key: 'createClient',
        value: function createClient(opts) {
            opts = Object.assign({}, {
                wsdl: null,
                terminalId: null,
                spCode: null,
                debug: false
            }, opts);

            if (!(opts.wsdl && opts.terminalId && opts.spCode)) {
                return Promise.reject('required wsdl, terminalId, spCode.');
            }

            this.debug = opts.debug;
            this.wsdl = opts.wsdl;
            this._client = new _client2.default({ wsdl: this.wsdl });
            this.conf = {
                terminalId: opts.terminalId,
                spCode: opts.spCode,
                version: VERSION
            };

            return this._startup();
        }
    }, {
        key: '_readFile',
        value: function _readFile(filePath) {
            var path = '' + this._confRoot + filePath;
            return _fsPromise2.default.readFile(path, 'utf8');
        }
    }, {
        key: '_readXML',
        value: function _readXML(filePath, arg) {
            return this._readFile(filePath).then(function (plain) {
                return (0, _underscore.template)(plain)(arg);
            });
        }

        // headの作成は調整が入りそう

    }, {
        key: '_createRequest',
        value: function _createRequest(filePath, arg) {
            var _this = this;

            var createXML = [this._readXML(HEAD_PATH, Object.assign({}, this.conf, arg)), this._readXML(filePath, arg)];

            return Promise.all(createXML).then(function (xmls) {
                if (_this.debug) {
                    log('---------- HEAD -----------');
                    log(xmls[0]);
                    log('---------- BODY -----------');
                    log(xmls[1]);
                    log('---------------------------');
                }

                return {
                    head: xmls[0],
                    body: xmls[1]
                };
            });
        }
    }, {
        key: '_post',
        value: function _post(filePath, arg) {
            var _this2 = this;

            return this._createRequest(filePath, arg).then(function (request) {
                return _this2._client.send(POST, request);
            });
        }
    }, {
        key: '_get',
        value: function _get(filePath, arg) {
            var _this3 = this;

            return this._createRequest(filePath, arg).then(function (request) {
                return _this3._client.send(GET, request);
            });
        }
    }, {
        key: '_startup',
        value: function _startup() {
            var _this4 = this;

            return this._readFile(CONF_PATH).then(function (jsonStr) {
                return JSON.parse(jsonStr);
            }).then(function (json) {
                Object.keys(json).forEach(function (apiName) {
                    var api = json[apiName];
                    var getInfo = api.get;
                    var postInfo = api.post;

                    var method = null;
                    if (getInfo) {
                        method = '' + GET + (0, _underscore2.classify)(apiName);
                        _this4[method] = function (arg) {
                            return _this4._get(getInfo.path, _extends({
                                telegramId: getInfo.telegramId
                            }, arg));
                        };

                        if (_this4.debug) {
                            log('========== METHOD ========');
                            log(method);
                            log('---------- ARGS ----------');
                            log(getInfo);
                        }
                    }

                    if (postInfo) {
                        method = '' + POST + (0, _underscore2.classify)(apiName);
                        _this4[method] = function (arg) {
                            return _this4._post(postInfo.path, _extends({
                                telegramId: postInfo.telegramId,
                                terminalId: _this4.conf.terminalId
                            }, arg));
                        };

                        if (_this4.debug) {
                            log('========== METHOD ========');
                            log(method);
                            log('---------- ARGS ----------');
                            log(postInfo);
                        }
                    }
                });

                return _this4;
            });
        }
    }]);

    return NP;
}();

exports.default = new NP();
module.exports = exports['default'];