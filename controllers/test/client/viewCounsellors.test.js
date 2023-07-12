const request = require('supertest');
const app = require('../../../app.js');
const { query, pool } = require('../../../config/database.js');

//all counsellor retrieve
describe("Try to retrieve all counsellor data from database", () => {
    test("It should respond with status code 200 and return list of counsellors", async() => {
        const response = await request(app).get("/client/counsellors-view");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(Number),
                    email: expect.any(String),
                    role: "counsellor",
                    username: expect.any(String),
                    designation: expect.any(String),
                    // Include checks for all the properties you are expecting, except password
                })
            ])
        );
    });

});

//no counsellor found
describe("Try to retrieve all counsellor data from database when there is no counsellor data in database", () => {
    test("It should respond with status code 404 and return message 'No counsellors found in database'", async() => {
        // Start a new transaction
        await pool.query('BEGIN');
        // Empty the counsellors table
        await pool.query('DELETE FROM counsellors');

        const response = await request(app).get("/client/counsellors-view");

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            message: 'No counsellors found in database'
        });

        // Rollback the transaction so the DELETE doesn't actually affect the database
        await pool.query('ROLLBACK');
    });
});