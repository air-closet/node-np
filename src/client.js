import soap from 'soap'
import xmljson from 'xmljson'

class NetProtection {
    constructor(opts) {
        this.wsdl = opts.wsdl
        this._conn = null
    }

    _connect() {
        return new Promise((resolve, reject) => {
            soap.createClient(this.wsdl, (err, client) => {
                if (err) {
                    reject(err)
                } else {
                    this._conn = client
                    resolve()
                }
            })
        })
        .then(() => {
            console.log('success _connect')
        })
        .catch(err => {
            console.log(`connect error: ${JSON.stringify(err, null, '\t')}`)
            return err
        })
    }

    _getConnection() {
        if (!this._conn) {
            return this._connect()
        }
        return Promise.resolve()
    }

    _convertXml2Json(xmlStr) {
        return new Promise((resolve, reject) => {
            xmljson.to_json(xmlStr, (err, json) => {
                if (err) {
                    return reject(err)
                }
                return resolve(json)
            })
        })
    }

    _http(method, param) {
        return this._getConnection()
        .then(() => {
            console.log('start soap transfer')

            return new Promise((resolve, reject) => {
                const conn = this._conn
                conn[method].call(conn, param, (err, result) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(result)
                    }
                })
            })
        })
        .then(resultXml => {
            console.log('start converting xml to json')
            console.log(`soap result: ${JSON.stringify(resultXml)}`)

            const xmlStr = resultXml.postReturn.$value
            return this._convertXml2Json(xmlStr)
        })
        .catch(err => {
            console.error('occured error during _http')
            return Promise.reject(err)
        })
    }

    get(param) {
        return this._http('get', param)
    }

    post(param) {
        return this._http('post', param)
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
}

class NPClient extends NetProtection {
    constructor(opts) {
        opts = Object.assign({}, {
            wsdl: '',
        }, opts)

        super(opts)
    }

    registerTran() {
        // const INTERFACE = 'MS_CB_IN_0001'
        let head = `<head>
        <telegram_id>XU0010</telegram_id>
        <terminal_id>2000035000</terminal_id>
        <sp_code>mey6468977</sp_code>
        <version>2.00</version>
        </head>`

        let body = `<root>
        <telegram_id>XU0010</telegram_id>
        <terminal_id>2000035000</terminal_id>
        <transaction_details>
        <shop_transaction_id>0001</shop_transaction_id>
        <order_date>2016/12/31</order_date>
        <customer_information>
        <company_name>購入者会社名</company_name>
        <department>購入者部署名</department>
        <customer_name>購入者名</customer_name>
        <customer_name_kana>フリガナ</customer_name_kana>
        <zip>107-0052</zip>
        <address>東京都港区赤坂11-22-33 </address>
        <tel>03-1234-9999</tel>
        <email>test@gmail.com</email>
        </customer_information>
        <dest_information>
        <dest_company_name>配送先会社名</dest_company_name>
        <dest_department>配送先部署名</dest_department>
        <dest_customer_name>配送先名</dest_customer_name>
        <dest_customer_name_kana>フリガナ</dest_customer_name_kana>
        <dest_zip>151-0053</dest_zip>
        <dest_address>東京都渋谷区 </dest_address>
        <dest_tel>03-9999-9991</dest_tel>
        </dest_information>
        <settlement_type>02</settlement_type>
        <site_name>NPショップ</site_name>
        <site_url>https://www.google.co.jp/</site_url>
        <billed_amount>5500</billed_amount>
        <goods_details>
        <goods_information>
        <goods_name>ルーター</goods_name>
        <goods_price>5000</goods_price>
        <quantity>1</quantity>
        </goods_information>
        </goods_details>
        </transaction_details>
        </root>`

        return super.post({ head, body })
        .catch(err => {
            console.error('error')
            return Promise.reject(err)
        })
    }

    getTranResult() {
        // const INTERRFACE = 'MS_CB_IN_0001'
        // return super.get({ head, body })
    }
}

export default NPClient
// export default new NPClient()
