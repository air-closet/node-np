const fs = require('fs-promise')
const _ = require('underscore')
const NPClass = require('../lib/')
const assert = require('power-assert')

const defaultArg = {
    wsdl: 'https://test-api.com/',
    terminalId: 'terminalId',
    spCode: 'spCode',
    debug: false,
}

const NP = new NPClass(process.cwd())

describe('api wrapper', () => {
    it('default value', () => {
        assert(NP._confRoot === require('path').resolve(''))
    })

    const createClient = arg => NP.createClient(arg)
    const functions = [
        'getTran',
        'postTran',
        'getDeliveryBilling',
        'postDeliveryBilling',
        'getFixTran',
        'postFixTran',
        'getCancelTran',
        'postCancelTran',
        'getReTran',
        'postReTran',
        'getCredit',
        'getBillingDetails'
    ]


    it('createClient', () => {
        let values = {}

        return Promise.resolve(null)
        .then(val => createClient(val))
        .catch(err => assert(err === 'required wsdl, terminalId, spCode.'))
        .then(() => createClient(values))
        .catch(err => assert(err === 'required wsdl, terminalId, spCode.'))
        .then(() => { values.wsdl = 'dummyWsdl' })
        .then(() => createClient(values))
        .catch(err => assert(err === 'required wsdl, terminalId, spCode.'))
        .then(() => { values.terminalId = 'dummyTerminalId' })
        .then(() => createClient(values))
        .catch(err => assert(err === 'required wsdl, terminalId, spCode.'))
        .then(() => { values.spCode = 'dummySpCode' })
        .then(() => createClient(values))
        .then(client => {
            assert(client.debug === false)
            assert(client._client.wsdl === 'dummyWsdl')
            assert(client.wsdl === values.wsdl)
            assert(client.conf.terminalId === values.terminalId)
            assert(client.conf.spCode === values.spCode)
            assert(client.conf.version === '2.00')
        })
    })

    it('_startup: get dynamic methods', () => {
        const targets = functions

        return NP.createClient(defaultArg)
        .then(client => {
            let array = Object.keys(client).filter(key => typeof client[key] === 'function')
            array.forEach(methodName => assert(targets.includes(methodName)))
        })
    })

    it('_getPath', () => {
        const filePath = '/config/dummy/get.xml'

        return createClient(defaultArg)
        .then(cli => {
            const result = cli._getAbsoPath(filePath)
            assert(result === `${require('path').resolve('')}${filePath}`)
        })
    })

    it('_createRequest: get values for request', () => {
        let cli

        return createClient(defaultArg)
        .then(client => { cli = client })
        .then(() => {
            cli._client.send = (method, req) => Promise.resolve(req)
            return cli.getCredit()
        })
        .then(({ head, body }) => {
            assert(body === '')

            const headXmlPath = `${require('path').resolve('')}/config/head.xml`
            return fs.readFile(headXmlPath, 'utf8')
            .then(plain => {
                const conf = NP.conf
                const target = _.template(plain)({
                    telegramId: 'XD1010',
                    terminalId: conf.terminalId,
                    spCode: conf.spCode,
                    version: conf.version,
                })
                assert(head === target)
            })
        })
    })

    it('_createRequest: reject not found xml', () => {
        let cli

        return createClient(defaultArg)
        .then(client => { cli = client })
        .then(() => cli._createRequest('/error/error.xml', null))
        .catch(err => {
            assert(err.errno === -2)
            assert(err.code === 'ENOENT')
            assert(err.syscall === 'open')
        })
    })

    it('_get/_post', () => {
        const values = { content: 'ok' }
        let cli

        return createClient(defaultArg)
        .then(client => {
            cli = client
            cli._client.send = () => Promise.resolve(values)
            cli._createRequest = () => Promise.resolve()

            return cli._post()
        })
        .then(result => assert(result === values))
        .then(() => cli._get())
        .then(result => assert(result === values))
    })
})
