var express = require('express')
const connection = require('../config/database')
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(
  'sk_test_51NLGA4G6bSUSzoI0loSGitiavmJHQokQguS5QEGRZVWGutP8AhXNPyEiKOAi0FPrutkIOd58jGcBCvv9P1uxMTxe00wqCNfti0'
)
const uuid = require('uuid').v4
const moment = require('moment-timezone')
const bcrypt = require('bcrypt')
const { query, pool } = require('../config/database')

/*
Client Controller :
1. currentUser
2. registerClient
3. loginClient (tested - 3 case)
4. logoutClient
5. viewAppointment (tested - 3 case)
6. viewCounsellors (tested - 2 case)
7. viewCounsellor (tested - 2 case)
8. getCounsellorSessions (tested - 4 case)
9. bookAppointment 
10. makePayment
*/

module.exports = {
  // @desc Check login status
  // @route GET /api/current_user
  // @access private
  currentUser: async function currentUser(req, res) {
    const token = req.cookies.access_token
    if (!token) {
      res.status(401).send('Not authenticated')
      return
    }
    try {
      const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      res.json({ loggedInUser: user })
    } catch {
      res.status(403).send('Invalid token')
    }
  },

  // @desc Register a client
  // @route POST /client/register
  // @access public
  registerClient: async function registerClient(req, res) {
    // console.log('POST Request', req.body)

    // Check if client already exists
    try {
      const clientExists = await query(
        'SELECT * FROM clients WHERE email = $1',
        [email]
      )

      if (clientExists.rowCount > 0) {
        res
          .status(400)
          .json({ message: 'A client with this email already exists' })
        return
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Error checking client existence' })
      return
    }

    const {
      username,
      email,
      password,
      phone_number,
      age,
      marital_status,
      career,
      home_address,
      beneficiary_name,
      beneficiary_phone_number,
      nric = null,
    } = req.body

    // Check for empty fields
    const requiredFields = [
      'username',
      'email',
      'password',
      'phone_number',
      'age',
      'marital_status',
      'career',
      'home_address',
      'beneficiary_name',
      'beneficiary_phone_number',
    ]

    for (const field of requiredFields) {
      if (!req.body[field]) {
        res.status(400).json({ message: `${field} is required` })
        return
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' })
      return
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number',
      })
      return
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    // Insert a new record into the clients table
    try {
      const result = await query(
        `
          INSERT INTO clients (
              username,
              email,
              role,
              password,
              phone_number,
              age,
              marital_status,
              career,
              home_address,
              beneficiary_name,
              beneficiary_phone_number,
              nric
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
        `,
        [
          username,
          email,
          'client',
          hashedPassword,
          phone_number,
          age,
          marital_status,
          career,
          home_address,
          beneficiary_name,
          beneficiary_phone_number,
          nric,
        ]
      )

      res.status(200).json({ message: 'Client registration successful' })
      console.log('Client registration successful')
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Registration failed' })
    }
  },

  // @desc Login a client
  // @route POST /client/login
  // @access public
  loginClient: async function loginClient(req, res) {
    console.log('POST Request', req.body)

    const { email, password } = req.body

    // Check if the client exists in the database
    query('SELECT * FROM clients WHERE email=$1 LIMIT 1', [email])
      .then(function (result) {
        if (result.rowCount === 0) {
          res.status(404).json({ message: 'User not found' })
        } else {
          // Check if the password matches
          const client = result.rows[0]

          // Compare input password with hashed password in DB
          bcrypt.compare(password, client.password, (error, bcryptRes) => {
            if (bcryptRes) {
              // Password matched, generate a token and store it in cookies
              const accessToken = jwt.sign(
                client,
                process.env.ACCESS_TOKEN_SECRET
              )
              const userRole = client.role
              console.log(
                `Client login successful. Current user: Email: ${email} Password: ${password} Token: ${accessToken} Role: ${userRole}`
              )
              res.cookie('access_token', accessToken, {
                samSite: 'None',
                secure: true,
              })
              res.status(200).json({
                message: 'Client login successful',
                token: accessToken,
              })
            } else {
              res.status(401).json({ message: 'Wrong password' })
            }
          })
        }
      })
      .catch(function (error) {
        console.log(error)
        res.status(500).json({ message: 'Client login failed' })
      })
  },

  // @desc Logout a client
  // @route GET /client/logout
  // @access private
  logoutClient: async function logoutClient(req, res) {
    console.log('Logout Request')
    res.clearCookie('access_token')
    res.status(200).send('Client logout successful')
  },

  // @desc View client's appointment
  // @route GET /client/appointment-view
  // @access private
  viewAppointment: async function viewAppointment(req, res) {
    try {
      const client_id = req.user.id

      // Retrieve the appointment details
      const appointmentResult = await query(
        `
            SELECT counsellors.username as counsellor_username, appointments.main_issue, appointments.survey_answers, 
                appointments.appointment_status, appointments.appointment_id 
            FROM appointments 
            JOIN counsellors ON appointments.counsellor_id = counsellors.id 
            WHERE appointments.client_id = $1
            LIMIT 1
        `,
        [client_id]
      )

      const appointment = appointmentResult.rows

      if (appointment.length === 0) {
        return res.status(404).json({ message: 'Appointment record not found' })
      }

      const appointment_id = appointment[0].appointment_id

      // Retrieve the sessions associated with the appointment
      const sessionsResult = await query(
        `
            SELECT session_id, counsellor_feedback, session_number, date_time, payment_status, receipt_url 
            FROM sessions 
            WHERE appointment_id = $1
        `,
        [appointment_id]
      )

      const sessions = sessionsResult.rows

      // sessions.forEach((session) => {
      //     session.date_time = moment(session.date_time)
      //         .tz('Asia/Kuala_Lumpur')
      //         .format()
      // })

      const appointmentData = { ...appointment[0], sessions }

      return res
        .status(200)
        .json({ appointmentData: appointmentData, loggedInUser: req.user })
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        message: 'An error occurred while retrieving appointment data',
      })
    }
  },

  // @desc View list of counsellors
  // @route GET /client/counsellors-view
  // @access public
  viewCounsellors: async function viewCounsellors(req, res) {
    try {
      const result = await query(
        'SELECT id, email, role, username, designation, education, university, past_experience, personality, tagline, key_interest, created_at, updated_at, services FROM counsellors'
      )
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'No counsellors found in database' })
      } else {
        res.status(200).json(result.rows)
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: 'An error occurred while retrieving counsellor data' })
    }
  },

  // @desc View specific counsellor's info
  // @route GET /client/counsellors-view/:id
  // @access public
  viewCounsellor: async function viewCounsellor(req, res) {
    try {
      const { id } = req.params

      // Validate that the id is a positive integer
      if (!id || isNaN(id) || id < 1) {
        return res.status(400).json({ message: 'Invalid counsellor id.' })
      }

      // Retrieve specific record from the 'counsellors' table
      const result = await query(
        `
            SELECT 
                username, 
                updated_at, 
                university, 
                tagline, 
                services, 
                role, 
                personality, 
                past_experience, 
                key_interest, 
                id, 
                email, 
                education, 
                designation, 
                created_at 
            FROM 
                counsellors 
            WHERE 
                id = $1
            LIMIT 1
        `,
        [id]
      )

      const counsellor = result.rows[0]

      // If there's no such counsellor, send an error
      if (!counsellor) {
        return res.status(404).json({ message: 'Counsellor not found.' })
      }

      // Send the result to the client
      res.status(200).json(counsellor)
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: 'An error occurred while retrieving counsellor data.',
      })
    }
  },

  //@desc Retrieve all sessions for a specific counsellor
  //@route GET /client/:counsellorId/sessions
  //@access private
  getCounsellorSessions: async function (req, res) {
    try {
      const { counsellorId } = req.params

      console.log('loggedin user at GCS BE', req.user)

      const appointmentResult = await query(
        `
            SELECT appointment_id
            FROM appointments
            WHERE counsellor_id = $1
        `,
        [counsellorId]
      )

      const appointmentIds = appointmentResult.rows.map(
        (appointment) => appointment.appointment_id
      )

      const sessionsResult = await query(
        `
            SELECT *
            FROM sessions
            WHERE appointment_id = ANY ($1::int[])
        `,
        [appointmentIds]
      )

      const sessions = sessionsResult.rows

      if (sessions.length === 0) {
        return res
          .status(404)
          .json({ message: 'No sessions recorded for this counsellor' })
      }

      sessions.forEach((session) => {
        session.date_time = moment.utc(session.date_time).format()
      })

      res.json({
        sessions,
        loggedInUser: req.user,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  //@desc Book an appointment
  //@route POST /client/appointment-book
  //@access private
  bookAppointment: async function bookAppointment(req, res) {
    const {
      counsellor_id,
      survey_answers,
      main_issue,
      appointment_status,
      date_time,
    } = req.body
    const client_id = req.user.id

    let dateTime = moment(date_time).tz('Asia/Kuala_Lumpur').format()

    if (
      !client_id ||
      !counsellor_id ||
      !Array.isArray(survey_answers) ||
      survey_answers.length === 0 ||
      survey_answers.some((answer) => answer === '') ||
      !main_issue ||
      !appointment_status ||
      !dateTime ||
      !moment(dateTime).isValid()
    ) {
      return res
        .status(400)
        .json({ message: 'Please fill in all requested data' })
    }

    const survey_answers_object = {}
    survey_answers.forEach((answer, index) => {
      survey_answers_object[`question_${index + 1}`] = answer
    })

    try {
      // Get a new client from the connection pool
      const client = await pool.connect()

      try {
        // Begin transaction
        await client.query('BEGIN')

        // Insert into appointment table
        const appointmentRes = await client.query(
          `
                    INSERT INTO appointments (client_id, counsellor_id, survey_answers, main_issue, appointment_status)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `,
          [
            client_id,
            counsellor_id,
            survey_answers_object,
            main_issue,
            appointment_status,
          ]
        )

        // Insert into session table
        const sessionRes = await client.query(
          `
                    INSERT INTO sessions (appointment_id, session_number, date_time, payment_status)
                    VALUES ($1, 1, $2, 'unpaid')
                    RETURNING *
                `,
          [appointmentRes.rows[0].appointment_id, dateTime]
        )

        // Commit transaction
        await client.query('COMMIT')

        res.status(201).json({
          appointment: appointmentRes.rows[0],
          session: sessionRes.rows[0],
          message:
            'Counselling Session Application Successful. Please wait for confirmation from counsellor.',
        })
      } catch (error) {
        // Something went wrong in between, rollback the transaction
        await client.query('ROLLBACK')
        console.error(error)
        res.status(500).json({ message: 'Internal Server Error' })
      } finally {
        // Release the client back to the pool
        client.release()
      }
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  // @desc Update payment status for a session
  // @route PUT /client/make-payment/:sessionId
  // @access private
  makePayment: async function (req, res) {
    const sessionId = req.params.sessionId

    try {
      await query(
        `
            UPDATE sessions
            SET payment_status = 'paid'
            WHERE session_id = $1
        `,
        [sessionId]
      )

      const { product, token } = req.body

      const customer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      })

      const key = uuid()

      const charge = await stripe.charges.create(
        {
          amount: product.price * 100,
          currency: 'myr',
          customer: customer.id,
          receipt_email: token.email,
          description: `${product.name}${product.description}`,
          shipping: {
            name: token.card.name,
            address: {
              line1: token.card.address_line1,
              line2: token.card.address_line2,
              city: token.card.address_city,
              country: token.card.address_country,
              postal_code: token.card.address_zip,
            },
          },
        },
        {
          idempotencyKey: key,
        }
      )

      await query(
        `
            UPDATE sessions
            SET receipt_url = $1
            WHERE session_id = $2
        `,
        [charge.receipt_url, sessionId]
      )

      return res.status(200).json({ message: 'Payment successful' })
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ message: 'An error occurred while updating payment status' })
    }
  },
}
