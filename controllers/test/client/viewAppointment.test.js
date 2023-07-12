const request = require('supertest')
const app = require('../../../app.js')
const jwt = require('jsonwebtoken')
require('dotenv').config()

describe("Retrieve client's appointment from the database", () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 34, // actual user id from test database
      role: 'client',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 200 and return the appointment's data", async () => {
    const response = await request(app)
      .get('/client/appointment-view')
      .set('Cookie', `access_token=${token}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        appointmentData: expect.any(Object),
        loggedInUser: expect.objectContaining({
          id: expect.any(Number),
          role: 'client',
        }),
      })
    )
  })
})

describe("Try to retrieve client's appointment with invalid role", () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation for a user with a wrong role
    const user = {
      id: 1,
      role: 'counsellor', // the role that isn't allowed to make the request
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 403 and return error message 'Unauthorized'", async () => {
    const response = await request(app)
      .get('/client/appointment-view')
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({
      error: 'Unauthorized',
    })
  })
})

describe("Retrieve client's appointment from the database when no appointment exists", () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 31, // use a user id that you know doesn't have any appointments in your test database
      role: 'client',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 404 and return message '404 : Appointment record not found'", async () => {
    const response = await request(app)
      .get('/client/appointment-view')
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(404)
    expect(response.body).toEqual({
      message: 'Appointment record not found',
    })
  })
})
