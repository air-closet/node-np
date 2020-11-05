'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _soap = require('soap');

var soap = _interopRequireWildcard(_soap);

var _xmljson = require('xmljson');

var _xmljson2 = _interopRequireDefault(_xmljson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
    function Client(opts) {
        _classCallCheck(this, Client);

        if (!opts || !opts.wsdl) {
            throw new Error('required wsdl option');
        }
        this.wsdl = opts.wsdl;
        this.client = null;

        this.soap = soap;
        this.xmljson = _xmljson2.default;
    }

    _createClass(Client, [{
        key: '_connect',
        value: function _connect() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _this.soap.createClient(_this.wsdl, function (err, client) {
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
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.xmljson.to_json(xmlStr, function (err, json) {
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
            var _this3 = this;

            return this._getConnection().then(function () {
                return new Promise(function (resolve, reject) {
                    _this3.client[method].call(_this3.client, param, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            }).then(function (returnObj) {
                var xmlStr = returnObj[method + 'Return'].$value;
                return _this3._convertXml2Json(xmlStr);
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