import fs from 'fs-promise'
import { template } from 'underscore'
import { classify } from 'underscore.string'
import Client from './client'

const GET = 'get'
const POST = 'post'
const HEAD_PATH = '/config/head.xml'
const CONF_PATH = '/config/config.json'
const VERSION = '2.00'
const log = str => console.log(str)

class NP {
    constructor() {
        this._confRoot = process.cwd()
    }

    createClient(opts) {
        opts = Object.assign({}, {
            wsdl: null,
            terminalId: null,
            spCode: null,
            debug: false,
        }, opts)

        if (!(opts.wsdl && opts.terminalId && opts.spCode)) {
            return Promise.reject('required wsdl, terminalId, spCode.')
        }

        this.debug = opts.debug
        this.wsdl = opts.wsdl
        this._client = new Client({ wsdl: this.wsdl })
        this.conf = {
            terminalId: opts.terminalId,
            spCode: opts.spCode,
            version: VERSION,
        }

        return this._startup()
    }

    _readFile(filePath) {
        const path = `${this._confRoot}${filePath}`
        return fs.readFile(path, 'utf8')
    }

    _readXML(filePath, arg) {
        return this._readFile(filePath)
        .then(plain => template(plain)(arg))
    }

    // headの作成は調整が入りそう
    _createRequest(filePath, arg) {
        const createXML = [
            this._readXML(HEAD_PATH, Object.assign({}, this.conf, arg)),
            this._readXML(filePath, arg),
        ]

        return Promise.all(createXML)
        .then(xmls => {
            if (this.debug) {
                log('---------- HEAD -----------')
                log(xmls[0])
                log('---------- BODY -----------')
                log(xmls[1])
                log('---------------------------')
            }

            return {
                head: xmls[0],
                body: xmls[1],
            }
        })
    }

    _post(filePath, arg) {
        return this._createRequest(filePath, arg)
        .then(request => this._client.send(POST, request))
    }

    _get(filePath, arg) {
        return this._createRequest(filePath, arg)
        .then(request => this._client.send(GET, request))
    }

    _startup() {
        return this._readFile(CONF_PATH)
        .then(jsonStr => JSON.parse(jsonStr))
        .then(json => {
            Object.keys(json).forEach(apiName => {
                const api = json[apiName]
                const getInfo = api.get
                const postInfo = api.post

                let method = null
                if (getInfo) {
                    method = `${GET}${classify(apiName)}`
                    this[method] = arg => this._get(getInfo.path, {
                        telegramId: getInfo.telegramId,
                        ...arg })

                    if (this.debug) {
                        log('========== METHOD ========')
                        log(method)
                        log('---------- ARGS ----------')
                        log(getInfo)
                    }
                }

                if (postInfo) {
                    method = `${POST}${classify(apiName)}`
                    this[method] = arg => this._post(postInfo.path, {
                        telegramId: postInfo.telegramId,
                        terminalId: this.conf.terminalId,
                        ...arg })

                    if (this.debug) {
                        log('========== METHOD ========')
                        log(method)
                        log('---------- ARGS ----------')
                        log(postInfo)
                    }
                }
            })

            return this
        })
    }
}

export default new NP()
