const request = require('supertest');
const app = require('../../../app.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { query, pool } = require('../../../config/database.js');

describe("Retrieve details of an appointment", () => {
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

    test("It should respond with status code 200 and return the appointment details", async() => {
        const id = 57; // use a specific appointment id that you know exists in your test database
        const response = await request(app)
            .get(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('client_username');
        expect(response.body).toHaveProperty('counsellor_username');
        expect(response.body).toHaveProperty('main_issue');
        expect(response.body).toHaveProperty('appointment_id');
        expect(response.body).toHaveProperty('survey_answers');
        expect(response.body).toHaveProperty('appointment_status');
        expect(response.body).toHaveProperty('counsellor_id');
        expect(response.body).toHaveProperty('sessions');
        expect(response.body).toHaveProperty('loggedInUser');
    });
});

describe("Retrieve details of an appointment that doesn't exist", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 27, // use a user id of a counsellor
            username: 'Dr. Johnson',
            role: 'counsellor'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 404 and return message 'Appointment not found'", async() => {
        const id = 99999; // use a random appointment id that you know does not exist in your test database
        const response = await request(app)
            .get(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending our token

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Appointment not found' });
    });
});

describe("Attempt to retrieve appointment details as a non-counsellor", () => {
    let token;

    beforeAll(() => {
        // Simulate a valid token generation
        const user = {
            id: 27, // use a user id of a non-counsellor
            username: 'john_doe',
            role: 'client'
        };

        token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    });

    test("It should respond with status code 403 and return message 'Unauthorized'", async() => {
        const id = 57; // use a specific appointment id that you know exists in your test database
        const response = await request(app)
            .get(`/counsellor/appointment/${id}`)
            .set('Cookie', `access_token=${token}`); // sending the token of a non-counsellor user

        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ error: 'Unauthorized' });
    });
});