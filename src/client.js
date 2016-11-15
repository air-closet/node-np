import soap from 'soap'
import xmljson from 'xmljson'

class Client {
    constructor(opts) {
        this.wsdl = opts.wsdl
        this.client = null
    }

    _connect() {
        return new Promise((resolve, reject) => {
            soap.createClient(this.wsdl, (err, client) => {
                if (err) {
                    reject(err)
                } else {
                    this.client = client
                    resolve()
                }
            })
        })
        .then(() => {
            console.log('success _connect')
        })
        .catch(err => {
            console.log(`connect error: ${JSON.stringify(err, null, '\t')}`)
            return Promise.reject(err)
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
            xmljson.to_json(xmlStr, (err, json) => {
                if (err) {
                    return reject(err)
                }
                return resolve(json)
            })
        })
    }

    send(method, param) {
        return this._getConnection()
        .then(() => {
            console.log('start soap transfer')

            return new Promise((resolve, reject) => {
                this.client[method].call(this.client, param, (err, result) => {
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
}

export default Client
