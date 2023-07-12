const request = require('supertest')
const app = require('../../../app.js')
const jwt = require('jsonwebtoken')
require('dotenv').config()

describe('Retrieve all sessions for a specific counsellor', () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 34, // actual user id from test database
      role: 'client',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test('It should respond with status code 200 and return the session data', async () => {
    const counsellorId = 53 // Use an actual counsellor id from your test database
    const response = await request(app)
      .get(`/client/${counsellorId}/sessions`)
      .set('Cookie', `access_token=${token}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        sessions: expect.any(Array),
        loggedInUser: expect.objectContaining({
          id: expect.any(Number),
          role: 'client',
        }),
      })
    )
  })
})

describe('Try to retrieve sessions with invalid counsellorId', () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 34, // actual user id from test database
      role: 'client',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 500 and return error message 'Internal Server Error'", async () => {
    const counsellorId = 'invalid_id'
    const response = await request(app)
      .get(`/client/${counsellorId}/sessions`)
      .set('Cookie', `access_token=${token}`)

    expect(response.statusCode).toBe(500)
    expect(response.body).toEqual({
      message: 'Internal Server Error',
    })
  })
})

describe('Try to retrieve sessions for a counsellor who has no sessions', () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 34, // actual user id from test database
      role: 'client',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test('It should respond with status code 404 and return an error message', async () => {
    const counsellorId = 27 // Use a counsellor id who has no sessions
    const response = await request(app)
      .get(`/client/${counsellorId}/sessions`)
      .set('Cookie', `access_token=${token}`)

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({
      message: 'No sessions recorded for this counsellor',
    })
  })
})
