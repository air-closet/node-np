import fs from 'fs-promise'
import { template } from 'underscore'
import { classify } from 'underscore.string'
import Client from './client'
import CONST from './constants'

const readFile = path => fs.readFile(path, CONST.UTF8)
const readXML = (path, arg) => readFile(path)
.then(plain => {
    try {
        return template(plain)(arg)
    } catch (err) {
        return Promise.reject(err)
    }
})


class NP {
    constructor(root) {
        this._confRoot = root
    }

    createClient(opts) {
        if (this._client) {
            return Promise.resolve(this)
        }

        opts = Object.assign({}, {
            wsdl: null,
            terminalId: null,
            spCode: null,
            log: console,
        }, opts)

        if (!(opts.wsdl && opts.terminalId && opts.spCode)) {
            return Promise.reject(CONST.ERROR.CLIENT)
        }

        this.logger = opts.log
        this.wsdl = opts.wsdl
        this._client = new Client({ wsdl: this.wsdl })
        this.conf = {
            terminalId: opts.terminalId,
            spCode: opts.spCode,
            version: CONST.VERSION,
        }

        return this._startup()
    }

    _getAbsoPath(filePath) {
        return `${this._confRoot}${filePath}`
    }

    _createRequest(filePath, param) {
        const createXML = [
            readXML(this._getAbsoPath(CONST.PATH.HEAD), Object.assign({}, this.conf, param)),
            readXML(this._getAbsoPath(filePath), param),
        ]

        return Promise.all(createXML)
        .then(([head, body]) => {
            this.logger.info([
                CONST.LOG.HEAD,
                head,
                CONST.LOG.BODY,
                body,
                CONST.LOG.DELIMITER,
            ].join('\n'))

            return { head, body }
        })
    }

    _post(filePath, param) {
        return this._createRequest(filePath, param)
        .then(request => this._client.send(CONST.HTTP.POST, request))
        .then(response => response.accept_no)
    }

    _get(filePath, param, detailsKey) {
        return this._createRequest(filePath, param)
        .then(request => this._client.send(CONST.HTTP.GET, request))
        .catch(err => {
            let response = {}
            response[detailsKey] = { regist_NG_result: { error_list: err } }

            return response
        })
        .then(response => this._convertGetResponseDetail(response[detailsKey]))
    }

    _convertGetResponseDetail(details) {
        if (details.regist_NG_result) {
            return {
                error: details.regist_NG_result.error_list,
            }
        }

        return {
            result: details.regist_OK_result || details,
        }
    }

    _startup() {
        return readFile(this._getAbsoPath(CONST.PATH.CONF))
        .then(jsonStr => JSON.parse(jsonStr))
        .then(json => {
            Object.keys(json).forEach(apiName => {
                const api = json[apiName]
                const getInfo = api.get
                const postInfo = api.post

                let method = null
                if (getInfo) {
                    method = `${CONST.HTTP.GET}${classify(apiName)}`

                    // catch-handler is common error in NP
                    this[method] = param => Promise.resolve()
                    .then(() => this._get(getInfo.path, {
                        telegramId: getInfo.telegramId,
                        ...param,
                    }, getInfo.response))

                    this.logger.info([
                        CONST.LOG.METHOD,
                        method,
                        CONST.LOG.PARAM,
                        getInfo,
                    ].join('\n'))
                }

                if (postInfo) {
                    method = `${CONST.HTTP.POST}${classify(apiName)}`

                    this[method] = param => Promise.resolve()
                    .then(() => this._post(postInfo.path, {
                        telegramId: postInfo.telegramId,
                        terminalId: this.conf.terminalId,
                        ...param,
                    }))

                    this.logger.info([
                        CONST.LOG.METHOD,
                        method,
                        CONST.LOG.PARAM,
                        postInfo,
                    ].join('\n'))
                }
            })

            return this
        })
    }
}

export default NP
