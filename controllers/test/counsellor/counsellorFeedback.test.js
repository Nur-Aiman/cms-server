const request = require('supertest')
const app = require('../../../app.js')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { query, pool } = require('../../../config/database.js')

describe("Save counsellor's feedback", () => {
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

  test('It should respond with status code 200 and save the feedback', async () => {
    const sessionId = 100 // use a specific session id that you know exists in your test database
    const feedback = 'Excellent progress, keep it up' // test feedback
    const response = await request(app)
      .put(`/counsellor/session/${sessionId}/feedback`)
      .send({ feedback, loggedInUserId: 28 })
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: "Counsellor's feedback updated successfully",
    })
  })
})

describe("Try to save feedback for a session that doesn't belong to the logged in counsellor", () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation
    const user = {
      id: 28, // use a user id of a different counsellor
      username: 'Dr. Martinez',
      role: 'counsellor',
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 403 and return message 'You do not have permission to save feedback for this session.'", async () => {
    const sessionId = 104 // use a specific session id that you know exists in your test database but doesn't belong to the counsellor with id 54
    const feedback = 'Good progress' // test feedback
    const response = await request(app)
      .put(`/counsellor/session/${sessionId}/feedback`)
      .send({ feedback, loggedInUserId: 28 })
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({
      message: 'You do not have permission to save feedback for this session.',
    })
  })
})

describe('Try to save feedback with invalid role', () => {
  let token

  beforeAll(() => {
    // Simulate a valid token generation for a user with a wrong role
    const user = {
      id: 27,
      role: 'client', // the role that isn't allowed to make the request
    }

    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  })

  test("It should respond with status code 403 and return message 'You do not have permission to save feedback for this session.'", async () => {
    const sessionId = 104 // use a specific session id that you know exists in your test database
    const feedback = 'Good progress' // test feedback
    const response = await request(app)
      .put(`/counsellor/session/${sessionId}/feedback`)
      .send({ feedback, loggedInUserId: 27 })
      .set('Cookie', `access_token=${token}`) // sending our token

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({
      error: 'Unauthorized',
    })
  })
})
