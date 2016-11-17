'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _soap = require('soap');

var _soap2 = _interopRequireDefault(_soap);

var _xmljson = require('xmljson');

var _xmljson2 = _interopRequireDefault(_xmljson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
    function Client(opts) {
        _classCallCheck(this, Client);

        this.wsdl = opts.wsdl;
        this.client = null;
    }

    _createClass(Client, [{
        key: '_connect',
        value: function _connect() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _soap2.default.createClient(_this.wsdl, function (err, client) {
                    if (err) {
                        reject(err);
                    } else {
                        _this.client = client;
                        resolve();
                    }
                });
            });
        }
    }, {
        key: '_getConnection',
        value: function _getConnection() {
            if (!this.client) {
                return this._connect();
            }
            return Promise.resolve();
        }
    }, {
        key: '_convertXml2Json',
        value: function _convertXml2Json(xmlStr) {
            return new Promise(function (resolve, reject) {
                _xmljson2.default.to_json(xmlStr, function (err, json) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(json);
                });
            });
        }
    }, {
        key: 'send',
        value: function send(method, param) {
            var _this2 = this;

            return this._getConnection().then(function () {
                return new Promise(function (resolve, reject) {
                    _this2.client[method].call(_this2.client, param, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            }).then(function (returnObj) {
                var xmlStr = returnObj[method + 'Return'].$value;
                return _this2._convertXml2Json(xmlStr);
            }).then(function (json) {
                json = json.root || json;

                if (json.error_info) {
                    return Promise.reject(json.error_info);
                }
                return json;
            });
        }
    }]);

    return Client;
}();

exports.default = Client;
module.exports = exports['default'];