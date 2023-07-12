var express = require('express')
const connection = require('../config/database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { query, pool } = require('../config/database')
/*
                Admin Controller : 
                1. registerAdmin
                2. loginAdmin
                3. logoutAdmin
                4. registerCounsellor
                5. viewClients
                6. deleteClient
                */

module.exports = {
  // @desc Register an admin
  // @route POST /admin/register
  // @access private
  registerAdmin: async function registerAdmin(req, res) {
    try {
      console.log('POST Request', req.body)

      const { email, password, name } = req.body

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }

      // Validate password requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
      if (!passwordRegex.test(password)) {
        throw new Error(
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number'
        )
      }

      // Insert a new record into the admins table
      const sqlQuery = `
                INSERT INTO admins (email, role, password, name)
                VALUES ($1, 'admin', $2, $3)
                RETURNING id
            `

      var result = await query(sqlQuery, [email, password, name])

      // If insertion is successful
      res.send('admin registration successful')
    } catch (error) {
      console.log(error)
      req.flash('error', error.message || 'Registration failed')
      res.redirect('/admins/register')
    }
  },

  // @desc Login an admin
  // @route POST /admin/login
  // @access public
  loginAdmin: async function loginAdmin(req, res) {
    console.log('POST Request', req.body)

    const { email, password } = req.body

    // Check if the admin exists in the database
    const sqlQuery = `
        SELECT * FROM admins 
        WHERE email = $1
        LIMIT 1
    `

    try {
      const result = await query(sqlQuery, [email])

      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Admin not found' })
      } else {
        // Check if the password matches
        const admin = result.rows[0]
        if (admin.password === password) {
          // Password matched, generate a token and store it in cookies
          const accessToken = jwt.sign(admin, process.env.ACCESS_TOKEN_SECRET)
          const userRole = admin.role
          console.log(
            `Admin login successful. Current user: Email: ${email} Password: ${password} Token: ${accessToken} Role: ${userRole}`
          )
          res.cookie('access_token', accessToken)
          res
            .status(200)
            .json({ message: 'Admin login successful', token: accessToken })
        } else {
          // Password didn't match, return an error
          res.status(401).json({ message: 'Wrong password' })
        }
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Login failed' })
    }
  },

  // @desc Logout an admin
  // @route GET /admin/logout
  // @access private
  logoutAdmin: async function logoutAdmin(req, res) {
    console.log('Logout Request')
    res.clearCookie('access_token')
    res.send('Admin logout successful')
  },

  // @desc Register a counsellor
  // @route POST /admin/registerCounsellor
  // @access private
  registerCounsellor: async function registerCounsellor(req, res) {
    try {
      console.log('POST Request', req.body)

      const {
        email,
        password,
        username,
        designation,
        education,
        university,
        past_experience,
        personality,
        tagline,
        key_interest,
      } = req.body

      // Validate if there are empty fields
      if (
        !email ||
        !password ||
        !username ||
        !designation ||
        !education ||
        !university ||
        !past_experience ||
        !personality ||
        !tagline ||
        !key_interest
      ) {
        return res.status(400).json({
          message: 'All fields are required',
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: 'Invalid email format',
        })
      }

      // Validate password requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number',
        })
      }

      // Hash password
      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(password, salt)

      // Insert a new record into the counsellors table
      const result = await pool.query(
        `
                INSERT INTO counsellors (
                    email,
                    role,
                    password,
                    username,
                    designation,
                    education,
                    university,
                    past_experience,
                    personality,
                    tagline,
                    key_interest
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
            `,
        [
          email,
          'counsellor',
          hashedPassword,
          username,
          designation,
          education,
          university,
          JSON.stringify(past_experience),
          JSON.stringify(personality),
          tagline,
          JSON.stringify(key_interest),
        ]
      )

      // If insertion is successful
      return res.status(200).json({
        message: 'counsellor registration successful',
      })
    } catch (error) {
      console.log(error)

      if (error.message.includes('duplicate key value')) {
        return res.status(409).json({
          message: 'User with this email already exists',
        })
      }

      // For all other server errors
      return res.status(500).json({
        message: 'Server error. Please try again later.',
      })
    }
  },

  // @desc View list of clients
  // @route GET /admin/clients-view
  // @access private
  viewClients: async function viewClients(req, res) {
    try {
      const result = await query(
        'SELECT id, username, email, phone_number, age, marital_status, career, home_address, beneficiary_name, beneficiary_phone_number FROM clients'
      )

      // If no clients were found, return an error
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'No clients found in database' })
      } else {
        res.status(200).json({ clients: result.rows, loggedInUser: req.user })
      }
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .json({ message: 'An error occurred while retrieving client data' })
    }
  },

  // @desc Delete a client
  // @route DELETE /admin/deleteClient/:id
  // @access private
  deleteClient: async function deleteClient(req, res) {
    // Get client id from params
    const clientId = req.params.id

    try {
      // Start transaction
      await query('BEGIN')

      // Delete appointments and sessions related to the client
      await query(
        'DELETE FROM sessions WHERE appointment_id IN (SELECT appointment_id FROM appointments WHERE client_id = $1)',
        [clientId]
      )
      await query('DELETE FROM appointments WHERE client_id = $1', [clientId])

      // Delete client
      await query('DELETE FROM clients WHERE id = $1', [clientId])

      // Commit transaction
      await query('COMMIT')

      res.status(200).json({
        message: `Client with id: ${clientId} and all related data was deleted successfully.`,
      })
    } catch (error) {
      // If an error occurred, rollback changes
      await query('ROLLBACK')
      console.log(error)
      res
        .status(500)
        .json({ message: 'An error occurred while deleting the client.' })
    }
  },
}
