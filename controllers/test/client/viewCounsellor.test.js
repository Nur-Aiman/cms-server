const request = require('supertest');
const app = require('../../../app.js');
const { query, pool } = require('../../../config/database.js');

// Retrieve a specific counselor
describe("Retrieve a specific counselor's data from the database", () => {
    let id;

    beforeAll(async() => {
        const { rows } = await pool.query("SELECT id FROM counsellors LIMIT 1");
        id = rows[0].id;
    });

    test("It should respond with status code 200 and return the counselor's data", async() => {
        const response = await request(app).get(`/client/counsellors-view/${id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                id: id,
                email: expect.any(String),
                role: "counsellor",
                username: expect.any(String),
                designation: expect.any(String),
                // Include checks for all the properties you are expecting
            })
        );
    });
});


// Retrieve a non-existing counselor
describe("Try to retrieve a non-existing counselor's data", () => {
    test("It should respond with status code 404 and return message 'Counsellor not found.'", async() => {
        const nonExistentId = 9999999;
        const response = await request(app).get(`/client/counsellors-view/${nonExistentId}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            message: 'Counsellor not found.'
        });
    });
});