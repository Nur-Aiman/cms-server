const request = require('supertest');
const app = require('../../../app.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query, pool } = require('../../../config/database.js');

describe("Confirm an appointment", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 53, // actual user id from test database
            username: 'Dr. Syed',
            role: 'counsellor'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 200 and confirm the appointment", async() => {
        const id = 62; // use a specific appointment id that you know exists in your test database
        const response = await request(app)
            .put(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: "Appointment has been confirmed" });
    });
});

describe("Try to confirm an appointment that doesn't exist or appointment that does not belong to the logged in counsellor", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 26, // use a user id of a counsellor
            username: 'Dr. Johnson',
            role: 'counsellor'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 403 and return message 'Access Denied: You are not the assigned counsellor for this appointment.'", async() => {
        const id = 57; // use a random appointment id that you know does not exist in your test database
        const response = await request(app)
            .put(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ message: "Access Denied: You are not the assigned counsellor for this appointment." });
    });
});

describe("Try to confirm an appointment with invalid role", () => {
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
        const id = 59; // use a specific appointment id that you know exists in your test database
        const response = await request(app)
            .put(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ error: 'Unauthorized' });
    });
});