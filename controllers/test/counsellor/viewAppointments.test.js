const request = require('supertest');
const app = require('../../../app.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query, pool } = require('../../../config/database.js');

describe("Retrieve counsellor's appointments from the database", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 26, // actual user id from test database
            username: 'Dr. Johnson',
            role: 'counsellor'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 200 and return the appointments' data", async() => {
        const status = 'Active';
        const response = await request(app)
            .get(`/counsellor/appointments?status=${status}`)
            .set('Cookie', `access_token=${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                appointments: expect.any(Array),
                loggedInUser: expect.objectContaining({
                    id: expect.any(Number),
                    username: 'Dr. Johnson',
                    role: 'counsellor',
                    iat: expect.any(Number),
                    exp: expect.any(Number)
                })
            })
        );
    });
});

describe("Try to retrieve counsellor's appointments with invalid role", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation for a user with a wrong role
        const user = {
            id: 26,
            role: 'client' // the role that isn't allowed to make the request
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 403 and return error message 'Unauthorized'", async() => {
        const status = 'Active';
        const response = await request(app)
            .get(`/counsellor/appointments?status=${status}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({
            error: 'Unauthorized'
        });
    });
});

describe("Retrieve counsellor's appointments from the database when no appointment exists", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 27, // use a user id that you know doesn't have any appointments in your test database
            username: 'Dr. Gupta',
            role: 'counsellor'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 404 and return message 'No appointments recorded'", async() => {
        // Start a new transaction
        await pool.query('BEGIN');
        // Empty the sessions table
        await pool.query('DELETE FROM sessions');
        // Empty the appointments table
        await pool.query('DELETE FROM appointments');

        const status = 'Active';
        const response = await request(app)
            .get(`/counsellor/appointments?status=${status}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            message: 'No appointments recorded'
        });

        // Rollback the transaction so the DELETE doesn't actually affect the database
        await pool.query('ROLLBACK');
    });
});