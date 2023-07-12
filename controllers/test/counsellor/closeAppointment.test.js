const request = require('supertest')
const app = require('../../../app.js')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { query, pool } = require('../../../config/database.js')

describe("Close counsellor's appointment", () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 28, // actual counsellor id from test database
      username: 'Dr. Martinez',
      role: 'counsellor',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test('It should respond with status code 200 and close the appointment', async () => {
    const appointmentId = 57 // use a specific appointment id that you know exists in your test database
    const response = await request(app)
      .put(`/counsellor/appointment-close/${appointmentId}`)
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'Appointment closed successfully',
    })
  })
})

describe('Try to close an appointment with invalid role', () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation for a user with a wrong role
    const user = {
      id: 34,
      role: 'client', // the role that isn't allowed to make the request
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 403 and return message 'Failed to close appointment. Internal Server Error'", async () => {
    const appointmentId = 57 // use a specific appointment id that you know exists in your test database
    const response = await request(app)
      .put(`/counsellor/appointment-close/${appointmentId}`)
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({
      error: 'Unauthorized',
    })
  })
})
