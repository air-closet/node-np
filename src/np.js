import fs from 'fs-promise'
import { template } from 'underscore'
import { classify } from 'underscore.string'
import Client from './client'
import CONST from './constants'

const { log } = console
const readFile = path => fs.readFile(path, CONST.UTF8)
const readXML = (path, arg) => readFile(path).then(plain => template(plain)(arg))

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
            debug: false,
        }, opts)

        if (!(opts.wsdl && opts.terminalId && opts.spCode)) {
            return Promise.reject(CONST.ERROR.CLIENT)
        }

        this.debug = opts.debug
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

    _createRequest(filePath, arg) {
        const createXML = [
            readXML(this._getAbsoPath(CONST.PATH.HEAD), Object.assign({}, this.conf, arg)),
            readXML(this._getAbsoPath(filePath), arg),
        ]

        return Promise.all(createXML)
        .then(([head, body]) => {
            if (this.debug) {
                log(CONST.LOG.HEAD)
                log(head)
                log(CONST.LOG.BODY)
                log(body)
                log(CONST.LOG.DELIMITER)
            }

            return { head, body }
        })
    }

    _post(filePath, arg) {
        return this._createRequest(filePath, arg)
        .then(request => this._client.send(CONST.HTTP.POST, request))
        .then(response => response.accept_no)
    }

    _get(filePath, arg) {
        return this._createRequest(filePath, arg)
        .then(request => this._client.send(CONST.HTTP.GET, request))
        .then(response => this._convertGetResponse(response))
    }

    _convertGetResponse(response) {
        response = response.details

        if (response.regist_NG_result) {
            return {
                status: CONST.RESPONSE.NG,
                error: response.regist_NG_result.error_list,
            }
        }

        return {
            status: CONST.RESPONSE.OK,
            result: response.regist_OK_result || response,
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
                    this[method] = arg => Promise.resolve()
                    .then(() => this._get(getInfo.path, {
                        telegramId: getInfo.telegramId,
                        ...arg,
                    }))
                    .then(response => {
                        response.details = response[getInfo.response]

                        delete response[getInfo.response]
                        return response
                    })
                    .catch(err => ({
                        details: { regist_NG_result: { error_list: err } }
                    }))

                    if (this.debug) {
                        log(CONST.LOG.METHOD)
                        log(method)
                        log(CONST.LOG.PARAM)
                        log(getInfo)
                    }
                }

                if (postInfo) {
                    method = `${CONST.HTTP.POST}${classify(apiName)}`
                    this[method] = arg => this._post(postInfo.path, {
                        telegramId: postInfo.telegramId,
                        terminalId: this.conf.terminalId,
                        ...arg })

                    if (this.debug) {
                        log(CONST.LOG.METHOD)
                        log(method)
                        log(CONST.LOG.PARAM)
                        log(postInfo)
                    }
                }
            })

            return this
        })
    }
}

export default NP
