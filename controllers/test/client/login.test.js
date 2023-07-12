const request = require('supertest');
const app = require('../../../app.js');


describe("Try login with email with correct credentials", () => {
    test("It should response with status code 200 and return message 'Client login successful'", () => {
        return request(app)
            .post("/client/login")
            .send({
                email: "nguyen_hai@example.com",
                password: "PasswordNguyenHai321",
            })
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body.message).toEqual("Client login successful");
            });
    });
});

describe("Try login with non-existing client", () => {
    test("It should response with status code 404 and return message 'User not found'", () => {
        return request(app)
            .post("/client/login")
            .send({
                email: "non_existing@example.com",
                password: "password",
            })
            .then(response => {
                expect(response.statusCode).toBe(404);
                expect(response.body.message).toEqual("User not found");
            });
    });
});

describe("Try login with incorrect password", () => {
    test("It should response with status code 401 and return message 'Wrong password'", () => {
        return request(app)
            .post("/client/login")
            .send({
                email: "nguyen_hai@example.com",
                password: "WrongPassword321",
            })
            .then(response => {
                expect(response.statusCode).toBe(401);
                expect(response.body.message).toEqual("Wrong password");
            });
    });
});



//Try login using username
//Try login using emailf
//Try login with wrong password