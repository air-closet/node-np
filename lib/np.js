'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _underscore = require('underscore');

var _underscore2 = require('underscore.string');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var readFile = function readFile(path) {
    return _fsPromise2.default.readFile(path, _constants2.default.UTF8);
};
var readXML = function readXML(path, arg) {
    return readFile(path).then(function (plain) {
        try {
            return (0, _underscore.template)(plain)(arg);
        } catch (err) {
            return Promise.reject(err);
        }
    });
};

var NP = function () {
    function NP(root) {
        _classCallCheck(this, NP);

        this._confRoot = root;
    }

    _createClass(NP, [{
        key: 'createClient',
        value: function createClient(opts) {
            if (this._client) {
                return Promise.resolve(this);
            }

            opts = Object.assign({}, {
                wsdl: null,
                terminalId: null,
                spCode: null,
                log: console
            }, opts);

            if (!(opts.wsdl && opts.terminalId && opts.spCode)) {
                return Promise.reject(_constants2.default.ERROR.CLIENT);
            }

            this.logger = opts.log;
            this.wsdl = opts.wsdl;
            this._client = new _client2.default({ wsdl: this.wsdl });
            this.conf = {
                terminalId: opts.terminalId,
                spCode: opts.spCode,
                version: _constants2.default.VERSION
            };

            return this._startup();
        }
    }, {
        key: '_getAbsoPath',
        value: function _getAbsoPath(filePath) {
            return '' + this._confRoot + filePath;
        }
    }, {
        key: '_createRequest',
        value: function _createRequest(filePath, param) {
            var _this = this;

            var createXML = [readXML(this._getAbsoPath(_constants2.default.PATH.HEAD), Object.assign({}, this.conf, param)), readXML(this._getAbsoPath(filePath), param)];

            return Promise.all(createXML).then(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    head = _ref2[0],
                    body = _ref2[1];

                _this.logger.info([_constants2.default.LOG.HEAD, head, _constants2.default.LOG.BODY, body, _constants2.default.LOG.DELIMITER].join('\n'));

                return { head: head, body: body };
            });
        }
    }, {
        key: '_post',
        value: function _post(filePath, param) {
            var _this2 = this;

            return this._createRequest(filePath, param).then(function (request) {
                return _this2._client.send(_constants2.default.HTTP.POST, request);
            }).then(function (response) {
                return { result: response.accept_no };
            });
        }
    }, {
        key: '_get',
        value: function _get(filePath, param, detailsKey) {
            var _this3 = this;

            return this._createRequest(filePath, param).then(function (request) {
                return _this3._client.send(_constants2.default.HTTP.GET, request);
            }).catch(function (err) {
                var response = {};
                response[detailsKey] = { regist_NG_result: { error_list: err } };

                return response;
            }).then(function (response) {
                return _this3._convertGetResponseDetail(response[detailsKey]);
            });
        }
    }, {
        key: '_convertGetResponseDetail',
        value: function _convertGetResponseDetail(details) {
            if (details.regist_NG_result) {
                return {
                    error: details.regist_NG_result.error_list
                };
            }

            return {
                result: details.regist_OK_result || details
            };
        }
    }, {
        key: '_startup',
        value: function _startup() {
            var _this4 = this;

            return readFile(this._getAbsoPath(_constants2.default.PATH.CONF)).then(function (jsonStr) {
                return JSON.parse(jsonStr);
            }).then(function (json) {
                Object.keys(json).forEach(function (apiName) {
                    var api = json[apiName];
                    var getInfo = api.get;
                    var postInfo = api.post;

                    var method = null;
                    if (getInfo) {
                        method = '' + _constants2.default.HTTP.GET + (0, _underscore2.classify)(apiName);

                        // catch-handler is common error in NP
                        _this4[method] = function (param) {
                            return Promise.resolve().then(function () {
                                return _this4._get(getInfo.path, _extends({
                                    telegramId: getInfo.telegramId
                                }, param), getInfo.response);
                            });
                        };
                    }

                    if (postInfo) {
                        method = '' + _constants2.default.HTTP.POST + (0, _underscore2.classify)(apiName);

                        _this4[method] = function (param) {
                            return Promise.resolve().then(function () {
                                return _this4._post(postInfo.path, _extends({
                                    telegramId: postInfo.telegramId,
                                    terminalId: _this4.conf.terminalId
                                }, param));
                            });
                        };
                    }
                });

                return _this4;
            });
        }
    }]);

    return NP;
}();

exports.default = NP;
module.exports = exports['default'];