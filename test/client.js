const assert = require('power-assert')
const Client = require('../lib/client')

const wsdl = 'https://www.example.com'

describe('soap client', () => {
    const notCreatingInstance = arg => {
        try {
            let instance = new Client(arg)
            if (instance) {
                assert.fail()
            }
        } catch (err) {
            assert(err.message === 'required wsdl option')
        }
    }
    it('constructor: not creating instance: no args', () => {
        notCreatingInstance()
    })

    it('constructor: not creating instance: no wsdl', () => {
        notCreatingInstance({})
    })

    it('constructor: not creating instance: wsdl', () => {
        notCreatingInstance({ wsdl: '' })
    })

    it('constructor', () => {
        let client = new Client({ wsdl })
        if (client) {
            assert(client !== null)
            assert(client.wsdl === wsdl)
            assert(client.client === null)
            assert(client.soap !== null)
            assert(client.xmljson !== null)
        } else {
            assert.fail()
        }
    })

    const dummyConnect = (instanceWsdl, func) => {
        if (instanceWsdl === 'err') {
            func({ content: 'dummy-error' }, {})
        } else {
            func(null, { content: 'ok' })
        }
    }

    it('_connect: reject', () => {
        let client = new Client({ wsdl: 'err' })
        client.soap.createClient = dummyConnect.bind(client)
        return client._connect()
        .catch(err => assert(err.content === 'dummy-error'))
    })

    it('_connect: resolve', () => {
        let client = new Client({ wsdl })
        client.soap.createClient = dummyConnect.bind(client)
        return client._connect()
        .then(() => assert(client.client.content === 'ok'))
    })

    it('_getConnection: nothing', () => {
        let client = new Client({ wsdl })
        client.client = { client: 'dummy' }
        client._connect = () => Promise.reject()

        return client._getConnection()
        .then(() => assert(client.client))
    })

    it('_getConnection: use _connect', () => {
        let flag = false
        let client = new Client({ wsdl })
        client.client = null

        client._connect = () => {
            flag = true
            return Promise.resolve()
        }

        return client._getConnection()
        .then(() => assert(flag))
    })

    it('_convertXml2Json: reject', () => {
        let client = new Client({ wsdl })
        let testData = new Error()

        return client._convertXml2Json(testData)
        .catch(err => assert(err))
    })

    it('_convertXml2Json: resolve', () => {
        let client = new Client({ wsdl })
        let testData = '<?xml version="1.0" encoding="UTF-8"?><test>dummyData</test>'

        return client._convertXml2Json(testData)
        .then(result => assert(result.test === 'dummyData'))
    })

    const dummyApi = (param, func) => {
        if (param === 'err') {
            func({ content: 'dummy' }, {})
        } else {
            func(null, {
                getReturn: { $value: 'getReturn' },
                postReturn: { $value: 'postReturn' },
            })
        }
    }

    it('send: get', () => {
        let client = new Client({ wsdl })
        client._connect = () => Promise.resolve()
        client._convertXml2Json = arg => Promise.resolve(arg)

        client.client = {}
        client.client.get = dummyApi.bind(client)

        return client.send('get', 'err')
        .catch(err => assert(err.content === 'dummy'))
        .then(() => client.send('get', {}))
        .then(result => assert(result === 'getReturn'))
        .then(() => {
            client._convertXml2Json = () => ({
                error_info: 'getJsonError',
            })

            return client.send('get', {})
        })
        .catch(err => assert(err === 'getJsonError'))
    })

    it('send: post', () => {
        let client = new Client({ wsdl })
        client._connect = () => Promise.resolve()
        client._convertXml2Json = arg => Promise.resolve(arg)

        client.client = {}
        client.client.post = dummyApi.bind(client)

        return client.send('post', 'err')
        .catch(err => assert(err.content === 'dummy'))
        .then(() => client.send('post', {}))
        .then(result => assert(result === 'postReturn'))
        .then(() => {
            client._convertXml2Json = () => ({
                error_info: 'postJsonError',
            })

            return client.send('post', {})
        })
        .catch(err => assert(err === 'postJsonError'))
    })
})
