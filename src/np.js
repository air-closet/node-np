import fs from 'fs-promise'
import _ from 'underscore'
import Client from './client'

const GET = 'get'
const POST = 'post'

// 一度のリクエストで必要なパラメータ
// : wsdl ( contains authentication parameter)
// : xmlFilename
// : parameter

// 想定されるケース
// ユーザー１人に対して一度の処理を行えば良し
// 一回の処理で複数人分の処理を行いたい

// フロー(基本方針は冪等性で、できるだけ状態を持たないことに意義を置く)
// 1. 最初にHEADタグを作成する( wsdl, authentication )
// 2. 処理を実行
//   2.1 forループ
//   2.2 BODYタグを作成する ( type, argArray )
//   2.3 リクエストを送る
//   2.4 後処理
// 3. 処理完了処理

// このクラスはシングルトンではなく、クラス自体をexportする
// class NPClient extends NetProtection {

class NP {
    constructor(opts) {
        opts = Object.assign({}, {
            wsdl: '',
            terminalId: '2000035000',
            spCode: 'mey6468977',
        }, opts)

        this.docRoot = `${process.cwd()}/config/`
        this.wsdl = opts.wsdl
        this.client = new Client({ wsdl: this.wsdl })

        this.conf = {
            terminalId: opts.terminalId,
            spCode: opts.spCode,
        }
    }

    _readFile(filename, param) {
        const path = `${this.docRoot}${filename}`

        return fs.readFile(path, 'utf8')
        .then(plain => {
            try {
                return Promise.resolve(_.template(plain)(param))
            } catch (e) {
                return Promise.reject(e)
            }
        })
    }

    _loadHead(arg) {
        return this._readFile('head.xml', Object.assign({}, this.conf, arg))
    }

    _createRequest(filename, arg) {
        const load = [this._loadHead(arg), this._readFile(filename, arg)]

        return Promise.all(load)
        .then(xmlArray => {
            console.log('---------- HEAD -----------')
            console.log(xmlArray[0])
            console.log('---------- BODY -----------')
            console.log(xmlArray[1])

            const param = {
                head: xmlArray[0],
                body: xmlArray[1],
            }

            return param
        })
    }

    _post(filename, arg) {
        return this._createRequest(filename, arg)
        .then(request => this.client.send(POST, request))
    }

    _get(filename, arg) {
        return this._createRequest(filename, arg)
        .then(request => this.client.send(GET, request))
    }

    registerTran() {
        const INTERFACE = 'MS_CB_IN_0001'
        const filename = 'registerTran.xml'
        const arg = {
            telegramId: 'XU0010',
            version: '2.00',
        }

        console.log(INTERFACE)

        return this._post(filename, arg)
    }
}

export default NP
