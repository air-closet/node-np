'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GET = 'get';
var POST = 'post';

// 一度のリクエストで必要なパラメータ
// : wsdl ( contains authentication parameter)
// : xmlFilename
// : parameter

// 想定されるケース
// ユーザー１人に対して一度の処理を行えば良し
// 一回の処理で複数人分の処理を行いたい

// フロー(基本方針は冪等性で、できるだけ状態を持たないことに意義を置く)
// 1. 最初にHEADタグを作成する( wsdl, authentication )
// 2. 処理を実行
//   2.1 forループ
//   2.2 BODYタグを作成する ( type, argArray )
//   2.3 リクエストを送る
//   2.4 後処理
// 3. 処理完了処理

// このクラスはシングルトンではなく、クラス自体をexportする
// class NPClient extends NetProtection {

var NP = function () {
    function NP(opts) {
        _classCallCheck(this, NP);

        opts = Object.assign({}, {
            wsdl: '',
            terminalId: '2000035000',
            spCode: 'mey6468977'
        }, opts);

        this.docRoot = process.cwd() + '/config/';
        this.wsdl = opts.wsdl;
        this.client = new _client2.default({ wsdl: this.wsdl });

        this.conf = {
            terminalId: opts.terminalId,
            spCode: opts.spCode
        };
    }

    _createClass(NP, [{
        key: '_readFile',
        value: function _readFile(filename, param) {
            var path = '' + this.docRoot + filename;

            return _fsPromise2.default.readFile(path, 'utf8').then(function (plain) {
                try {
                    return Promise.resolve(_underscore2.default.template(plain)(param));
                } catch (e) {
                    return Promise.reject(e);
                }
            });
        }
    }, {
        key: '_loadHead',
        value: function _loadHead(arg) {
            return this._readFile('head.xml', Object.assign({}, this.conf, arg));
        }
    }, {
        key: '_createRequest',
        value: function _createRequest(filename, arg) {
            var load = [this._loadHead(arg), this._readFile(filename, arg)];

            return Promise.all(load).then(function (xmlArray) {
                console.log('---------- HEAD -----------');
                console.log(xmlArray[0]);
                console.log('---------- BODY -----------');
                console.log(xmlArray[1]);

                var param = {
                    head: xmlArray[0],
                    body: xmlArray[1]
                };

                return param;
            });
        }
    }, {
        key: '_post',
        value: function _post(filename, arg) {
            var _this = this;

            return this._createRequest(filename, arg).then(function (request) {
                return _this.client.send(POST, request);
            });
        }
    }, {
        key: '_get',
        value: function _get(filename, arg) {
            var _this2 = this;

            return this._createRequest(filename, arg).then(function (request) {
                return _this2.client.send(GET, request);
            });
        }
    }, {
        key: 'registerTran',
        value: function registerTran() {
            var INTERFACE = 'MS_CB_IN_0001';
            var filename = 'registerTran.xml';
            var arg = {
                telegramId: 'XU0010',
                version: '2.00'
            };

            console.log(INTERFACE);

            return this._post(filename, arg);
        }
    }]);

    return NP;
}();

exports.default = NP;
module.exports = exports['default'];