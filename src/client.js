import soap from 'soap'
import xmljson from 'xmljson'

class Client {
    constructor(opts) {
        if (!opts || !opts.wsdl) {
            throw new Error('required wsdl option')
        }
        this.wsdl = opts.wsdl
        this.client = null

        this.soap = soap
        this.xmljson = xmljson
    }

    _connect() {
        return new Promise((resolve, reject) => {
            this.soap.createClient(this.wsdl, (err, client) => {
                if (err) {
                    reject(err)
                } else {
                    this.client = client
                    resolve()
                }
            })
        })
    }

    _getConnection() {
        if (!this.client) {
            return this._connect()
        }
        return Promise.resolve()
    }

    _convertXml2Json(xmlStr) {
        return new Promise((resolve, reject) => {
            this.xmljson.to_json(xmlStr, (err, json) => {
                if (err) {
                    return reject(err)
                }
                return resolve(json)
            })
        })
    }

    send(method, param) {
        return this._getConnection()
        .then(() => new Promise((resolve, reject) => {
            this.client[method].call(this.client, param, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        }))
        .then(returnObj => {
            const xmlStr = returnObj[`${method}Return`].$value
            return this._convertXml2Json(xmlStr)
        })
        .then(json => {
            json = json.root || json

            if (json.error_info) {
                return Promise.reject(json.error_info)
            }
            return json
        })
    }
}

export default Client
