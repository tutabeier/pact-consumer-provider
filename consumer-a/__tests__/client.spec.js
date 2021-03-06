const path = require('path')
const Pact = require('@pact-foundation/pact').Pact
const { getUser } = require('../src/client')

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000

const ENDPOINT = {
  url: 'http://127.0.0.1',
  port: 9999
}

describe('Consumer contract with Service A', () => {
  const provider = new Pact({
    consumer: 'frontend-client',
    provider: 'api-in-go',
    port: 9999,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    pactfileWriteMode: 'update',
    spec: 2,
  })

  beforeAll(done => {
    provider.setup().then(() => done())
  })

  afterAll((done) => {
    provider.finalize().then(() => done())
  })

  afterEach(() => {
    return provider.verify()
  })

  it('should return customer information if customer active', done => {
    provider.addInteraction({
      state: 'A customer with ID 1 exists',
      uponReceiving: 'a GET request to /users/1',
      withRequest: {
        method: 'GET',
        path: '/users/1',
        headers: { Accept: 'application/json' }
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          id: 1,
          name: 'Customer name',
          birthday: '1989-02-11',
          isActive: true
        }
      }
    })

    getUser(ENDPOINT, 1)
      .then(response => {
        expect(response.data.name).toBe('Customer name')

        done()
      })
  })

  it('should return 404 information if customer doesnt exist', done => {
    provider.addInteraction({
      state: 'A customer with ID 2 doesnt exists',
      uponReceiving: 'a GET request to /users/2',
      withRequest: {
        method: 'GET',
        path: '/users/2',
        headers: { Accept: 'application/json' }
      },
      willRespondWith: {
        status: 404,
      }
    })

    getUser(ENDPOINT, 2)
      .catch(err => {
        expect(err.response.status).toBe(404)
        done()
      })
  })
})
