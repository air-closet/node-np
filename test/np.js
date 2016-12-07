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
        'getChangeTran',
        'postChangeTran',
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
            cli._client.send = (method, req) => {
                let values = {
                    authori_result_details: req,
                }

                return Promise.resolve(values)
            }
            return cli.getCredit()
        })
        .then((response) => {
            const { head, body } = response.result
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
        const postValues = { accept_no: 'ok' }
        const getSuccessValues = {
            details: {
                regist_OK_result: { np_transaction_id: 'xxxxx' }
            }
        }
        const getRejectValues = {
            details: {
                regist_NG_result: { error_list: { error_no: 'xxx12345' } }
            }
        }
        let cli

        return createClient(defaultArg)
        .then(client => {
            cli = client
            cli._client.send = () => Promise.resolve(postValues)
            cli._createRequest = () => Promise.resolve()

            return cli._post()
        })
        .then(result => assert(result === postValues.accept_no))
        .then(() => {
            cli._client.send = () => Promise.resolve(getSuccessValues)
        })
        .then(() => cli._get('', '', 'details'))
        .then(response => {
            assert(response.result.np_transaction_id === 'xxxxx')
        })
        .then(() => {
            cli._client.send = () => Promise.resolve(getRejectValues)
        })
        .then(() => cli._get('', '', 'details'))
        .then(response => {
            assert(response.error.error_no === 'xxx12345')
        })
    })
})
