'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _soap = require('soap');

var _soap2 = _interopRequireDefault(_soap);

var _xmljson = require('xmljson');

var _xmljson2 = _interopRequireDefault(_xmljson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NetProtection = function () {
    function NetProtection(opts) {
        _classCallCheck(this, NetProtection);

        this.wsdl = opts.wsdl;
        this._conn = null;
    }

    _createClass(NetProtection, [{
        key: '_connect',
        value: function _connect() {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _soap2.default.createClient(_this.wsdl, function (err, client) {
                    if (err) {
                        reject(err);
                    } else {
                        _this._conn = client;
                        resolve();
                    }
                });
            }).then(function () {
                console.log('success _connect');
            }).catch(function (err) {
                console.log('connect error: ' + JSON.stringify(err, null, '\t'));
                return err;
            });
        }
    }, {
        key: '_getConnection',
        value: function _getConnection() {
            if (!this._conn) {
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
        key: '_http',
        value: function _http(method, param) {
            var _this2 = this;

            return this._getConnection().then(function () {
                console.log('start soap transfer');

                return new Promise(function (resolve, reject) {
                    var conn = _this2._conn;
                    conn[method].call(conn, param, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            }).then(function (resultXml) {
                console.log('start converting xml to json');
                console.log('soap result: ' + JSON.stringify(resultXml));

                var xmlStr = resultXml.postReturn.$value;
                return _this2._convertXml2Json(xmlStr);
            }).catch(function (err) {
                console.error('occured error during _http');
                return Promise.reject(err);
            });
        }
    }, {
        key: 'get',
        value: function get(param) {
            return this._http('get', param);
        }
    }, {
        key: 'post',
        value: function post(param) {
            return this._http('post', param);
        }
        // // export
        // createXml(filePath, param) {
        //     let header
        //     let content
        //
        //     switch (filePath) {
        //     case 'XU0010':
        //         header = ''
        //         content = ''
        //         break
        //     default:
        //         header = ''
        //         content = ''
        //     }
        //     //
        //     // return fs.readFile(filePath, 'utf8')
        //     // .then(result => _.template(result)(param))
        //     // .catch(err => Promise.reject(err))
        // }

    }]);

    return NetProtection;
}();

var NPClient = function (_NetProtection) {
    _inherits(NPClient, _NetProtection);

    function NPClient(opts) {
        _classCallCheck(this, NPClient);

        opts = Object.assign({}, {
            wsdl: ''
        }, opts);

        return _possibleConstructorReturn(this, (NPClient.__proto__ || Object.getPrototypeOf(NPClient)).call(this, opts));
    }

    _createClass(NPClient, [{
        key: 'registerTran',
        value: function registerTran() {
            // const INTERFACE = 'MS_CB_IN_0001'
            var head = '<head>\n        <telegram_id>XU0010</telegram_id>\n        <terminal_id>2000035000</terminal_id>\n        <sp_code>mey6468977</sp_code>\n        <version>2.00</version>\n        </head>';

            var body = '<root>\n        <telegram_id>XU0010</telegram_id>\n        <terminal_id>2000035000</terminal_id>\n        <transaction_details>\n        <shop_transaction_id>0001</shop_transaction_id>\n        <order_date>2016/12/31</order_date>\n        <customer_information>\n        <company_name>\u8CFC\u5165\u8005\u4F1A\u793E\u540D</company_name>\n        <department>\u8CFC\u5165\u8005\u90E8\u7F72\u540D</department>\n        <customer_name>\u8CFC\u5165\u8005\u540D</customer_name>\n        <customer_name_kana>\u30D5\u30EA\u30AB\u3099\u30CA</customer_name_kana>\n        <zip>107-0052</zip>\n        <address>\u6771\u4EAC\u90FD\u6E2F\u533A\u8D64\u574211-22-33 </address>\n        <tel>03-1234-9999</tel>\n        <email>test@gmail.com</email>\n        </customer_information>\n        <dest_information>\n        <dest_company_name>\u914D\u9001\u5148\u4F1A\u793E\u540D</dest_company_name>\n        <dest_department>\u914D\u9001\u5148\u90E8\u7F72\u540D</dest_department>\n        <dest_customer_name>\u914D\u9001\u5148\u540D</dest_customer_name>\n        <dest_customer_name_kana>\u30D5\u30EA\u30AB\u3099\u30CA</dest_customer_name_kana>\n        <dest_zip>151-0053</dest_zip>\n        <dest_address>\u6771\u4EAC\u90FD\u6E0B\u8C37\u533A </dest_address>\n        <dest_tel>03-9999-9991</dest_tel>\n        </dest_information>\n        <settlement_type>02</settlement_type>\n        <site_name>NP\u30B7\u30E7\u30C3\u30D5\u309A</site_name>\n        <site_url>https://www.google.co.jp/</site_url>\n        <billed_amount>5500</billed_amount>\n        <goods_details>\n        <goods_information>\n        <goods_name>\u30EB\u30FC\u30BF\u30FC</goods_name>\n        <goods_price>5000</goods_price>\n        <quantity>1</quantity>\n        </goods_information>\n        </goods_details>\n        </transaction_details>\n        </root>';

            return _get(NPClient.prototype.__proto__ || Object.getPrototypeOf(NPClient.prototype), 'post', this).call(this, { head: head, body: body }).catch(function (err) {
                console.error('error');
                return Promise.reject(err);
            });
        }
    }, {
        key: 'getTranResult',
        value: function getTranResult() {
            // const INTERRFACE = 'MS_CB_IN_0001'
            // return super.get({ head, body })
        }
    }]);

    return NPClient;
}(NetProtection);

exports.default = NPClient;
// export default new NPClient()

module.exports = exports['default'];