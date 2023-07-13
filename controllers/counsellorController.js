var express = require('express')
const connection = require('../config/database')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone')
const bcrypt = require('bcrypt') // Added bcrypt
const { query, pool } = require('../config/database')

/* 
Counsellor Controller : 
1. loginCounsellor
2. logoutCounsellors
3. viewAppointments (tested - 3 case)
4. viewAppointmentDetail (tested - 3 case)
5. updateCounsellor 
6. confirmAppointment (tested - 3 case)
7. closeAppointment (tested - 2 case)
8. bookNextSession 
9. preAppointmentNotes (tested - 3 case) 
10. counsellorFeedback (tested - 3 case)
*/

module.exports = {
    // @desc Login a counsellor
    // @route POST /counsellor/login
    // @access public
    loginCounsellor: async function loginCounsellor(req, res) {
        console.log('POST Request', req.body)

        const { email, password } = req.body

        try {
            const result = await query(
                'SELECT * FROM counsellors WHERE email = $1 LIMIT 1', [email]
            )

            if (result.rows.length === 0) {
                res.status(400).json({ message: 'Counsellor not found' })
            } else {
                // Check if the password matches
                const counsellor = result.rows[0]
                bcrypt.compare(password, counsellor.password, (err, isMatch) => {
                    if (err) {
                        throw err
                    } else if (!isMatch) {
                        // Password didn't match, return an error
                        res.status(400).json({ message: 'Wrong password' })
                    } else {
                        // Password matched, generate a token and store it in cookies
                        const accessToken = jwt.sign(
                            counsellor,
                            process.env.ACCESS_TOKEN_SECRET
                        )
                        const userRole = counsellor.role
                        console.log(
                            `Counsellor login successful. Current user: Email: ${email} Password: ${password} Token: ${accessToken} Role: ${userRole}`
                        )

                        res.cookie('access_token', accessToken)
                            // {
                            //   sameSite: false,
                            //   secure: true,
                            //   domain: '.onrender.com',
                            // }

                        res.status(200).json({
                            message: 'Counsellor login successful',
                            token: accessToken,
                        })
                    }
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Login failed' })
        }
    },

    // @desc Logout a counsellor
    // @route GET /counsellor/logout
    // @access private
    logoutCounsellors: async function logoutCounsellors(req, res) {
        console.log('Logout Request')
        res.clearCookie('access_token')
        res.send('Counsellor logout successful')
    },

    // @desc View sessions by status
    // @route GET /counsellor/appointments?status=...
    // @access private
    viewAppointments: async function(req, res) {
        try {
            const status = req.query.status

            const counsellor = req.query.counsellor

            let appointmentsQuery = `
SELECT clients.username as client_username, counsellors.username as counsellor_username, appointments.main_issue, appointments.appointment_id
FROM appointments
INNER JOIN clients ON appointments.client_id = clients.id
INNER JOIN counsellors ON appointments.counsellor_id = counsellors.id
WHERE appointments.appointment_status = $1
`

            let queryParams = [status]

            if (counsellor) {
                appointmentsQuery += ` AND counsellors.username = $2`
                queryParams.push(counsellor)
            }

            appointmentsQuery += ` ORDER BY appointments.appointment_id`

            const appointmentsResult = await query(appointmentsQuery, queryParams)
            const appointments = appointmentsResult.rows

            // If no appointments found, respond with a 404 error
            if (appointments.length === 0) {
                return res.status(404).json({ message: 'No appointments recorded' })
            }

            res.json({
                loggedInUser: req.user,
                appointments: appointments,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    // @desc View details of an appointment
    // @route GET /counsellor/appointment/:id
    // @access private
    viewAppointmentDetail: async function viewAppointmentDetail(req, res) {
        try {
            const { id } = req.params

            const appointmentQuery = `
        SELECT clients.username as client_username, clients.nric, clients.email, clients.phone_number,
               clients.age, clients.marital_status, clients.career,
               clients.home_address, clients.beneficiary_name,
               clients.beneficiary_phone_number, counsellors.username as counsellor_username,
               appointments.main_issue, appointments.appointment_id,
               appointments.survey_answers, appointments.appointment_status,
               appointments.counsellor_id
        FROM appointments
        INNER JOIN clients ON appointments.client_id = clients.id
        INNER JOIN counsellors ON appointments.counsellor_id = counsellors.id
        WHERE appointments.appointment_id = $1
    `

            const appointmentResult = await query(appointmentQuery, [id])
            const appointment = appointmentResult.rows[0]

            if (!appointment) {
                return res.status(404).json({ message: 'Appointment not found' })
            }

            const sessionsQuery = `
        SELECT *
        FROM sessions
        WHERE appointment_id = $1
    `

            const sessionsResult = await query(sessionsQuery, [id])
            const sessions = sessionsResult.rows

            sessions.forEach((session) => {
                session.date_time = moment(session.date_time).format()
            })

            res.json({
                ...appointment,
                sessions,
                loggedInUser: req.user,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    //@desc Update a counsellor's information
    //@route PUT /counsellor/:id
    //@access private
    updateCounsellor: async function(req, res) {
        const { id } = req.params
        const {
            password,
            username,
            designation,
            education,
            university,
            past_experience,
            personality,
            tagline,
            key_interest,
            services,
            email,
            role,
        } = req.body

        try {
            const counsellorQuery = `SELECT * FROM counsellors WHERE id = $1`
            const counsellorResult = await query(counsellorQuery, [id])
            const counsellor = counsellorResult.rows[0]

            const updatedCounsellor = {
                password: password ? password : counsellor.password,
                username: username ? username : counsellor.username,
                designation: designation ? designation : counsellor.designation,
                education: education ? education : counsellor.education,
                university: university ? university : counsellor.university,
                past_experience: past_experience ?
                    past_experience :
                    counsellor.past_experience,
                personality: personality ? personality : counsellor.personality,
                tagline: tagline ? tagline : counsellor.tagline,
                key_interest: key_interest ? key_interest : counsellor.key_interest,
                services: services ? services : counsellor.services,
                email: email ? email : counsellor.email,
                role: role ? role : counsellor.role,
            }

            const updateQuery = `
            UPDATE counsellors
            SET password = $1, username = $2, designation = $3, education = $4, university = $5, 
                past_experience = $6, personality = $7, tagline = $8, key_interest = $9, services = $10,
                email = $11, role = $12
            WHERE id = $13
        `

            const updateParams = [
                updatedCounsellor.password,
                updatedCounsellor.username,
                updatedCounsellor.designation,
                updatedCounsellor.education,
                updatedCounsellor.university,
                updatedCounsellor.past_experience,
                updatedCounsellor.personality,
                updatedCounsellor.tagline,
                updatedCounsellor.key_interest,
                updatedCounsellor.services,
                updatedCounsellor.email,
                updatedCounsellor.role,
                id,
            ]

            await query(updateQuery, updateParams)

            // Fetch the updated counsellor
            const updatedCounsellorDataResult = await query(counsellorQuery, [id])
            const updatedCounsellorData = updatedCounsellorDataResult.rows[0]

            res.status(200).json({
                message: 'Counsellor information updated successfully',
                counsellor: updatedCounsellorData,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    //@desc Confirm appointment
    //@route PUT /counsellor/appointment/:id
    //@access private
    confirmAppointment: async function confirmAppointment(req, res) {
        try {
            const { id } = req.params
            const loggedInUserId = req.user.id

            const checkAppointmentQuery = `
            SELECT counsellor_id 
            FROM appointments 
            WHERE appointment_id = $1
        `

            const appointmentResult = await query(checkAppointmentQuery, [id])
            const appointment = appointmentResult.rows[0]

            if (!appointment || appointment.counsellor_id !== loggedInUserId) {
                return res.status(403).json({
                    message: 'Access Denied: You are not the assigned counsellor for this appointment.',
                })
            }

            const updateAppointmentQuery = `
            UPDATE appointments
            SET appointment_status = 'Active'
            WHERE appointment_id = $1
        `

            await query(updateAppointmentQuery, [id])

            res.status(200).json({ message: 'Appointment has been confirmed' })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    //@desc Close appointment
    //@route PUT /counsellor/appointment-close/:id
    //@access private
    closeAppointment: async function closeAppointment(req, res) {
        try {
            const { id } = req.params

            const closeAppointmentQuery = `
      UPDATE appointments
      SET appointment_status = 'Close'
      WHERE appointment_id = $1
    `

            await query(closeAppointmentQuery, [id])

            res.status(200).json({ message: 'Appointment closed successfully' })
        } catch (error) {
            console.error(error)
            res
                .status(500)
                .json({ message: 'Failed to close appointment. Internal Server Error' })
        }
    },

    bookNextSession: async function bookNextSession(req, res) {
        try {
            const { id } = req.params
            const { date_time } = req.body

            // Find the maximum session_number for the given appointment_id
            const sessionNumbersRes = await query(
                `
                SELECT session_number 
                FROM sessions 
                WHERE appointment_id = $1
            `, [id]
            )

            let maxSessionNumber = 0
            if (sessionNumbersRes.rows.length > 0) {
                maxSessionNumber = Math.max(
                    ...sessionNumbersRes.rows.map((session) => session.session_number)
                )
            }

            // Add a new session with session_number incremented by 1
            await query(
                `
                INSERT INTO sessions (appointment_id, session_number, date_time, payment_status) 
                VALUES ($1, $2, $3, $4)
            `, [id, maxSessionNumber + 1, date_time, 'unpaid']
            )

            res.status(200).json({ message: 'New session added successfully' })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    //@desc Save counsellor's pre-appointment note
    //@route PUT /counsellor/session/:sessionId/note
    //@access private
    preAppointmentNotes: async function(req, res) {
        try {
            const { sessionId } = req.params
            const { note, loggedInUserId } = req.body

            // Retrieve session details
            const sessionDetails = await query(
                `
          SELECT * FROM sessions
          WHERE session_id = $1
      `, [sessionId]
            )

            // Retrieve appointment details
            const appointmentDetails = await query(
                `
          SELECT * FROM appointments
          WHERE appointment_id = $1
      `, [sessionDetails.rows[0].appointment_id]
            )

            // Check if the logged in user is the counsellor for this session
            if (appointmentDetails.rows[0].counsellor_id !== loggedInUserId) {
                return res.status(403).json({
                    message: 'You do not have permission to save notes for this session.',
                })
            }

            await query(
                `
          UPDATE sessions 
          SET counsellor_pre_appointment_note = $1
          WHERE session_id = $2
      `, [note, sessionId]
            )

            res.status(200).json({
                message: "Counsellor's pre-appointment note updated successfully",
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },

    //@desc Save counsellor's feedback
    //@route PUT /counsellor/session/:sessionId/feedback
    //@access private
    counsellorFeedback: async function(req, res) {
        try {
            const { sessionId } = req.params
            const { feedback, loggedInUserId } = req.body

            // Retrieve session details
            const sessionDetails = await query(
                `
          SELECT * FROM sessions
          WHERE session_id = $1
      `, [sessionId]
            )

            // Retrieve appointment details
            const appointmentDetails = await query(
                `
          SELECT * FROM appointments
          WHERE appointment_id = $1
      `, [sessionDetails.rows[0].appointment_id]
            )

            // Check if the logged in user is the counsellor for this session
            if (appointmentDetails.rows[0].counsellor_id !== loggedInUserId) {
                return res.status(403).json({
                    message: 'You do not have permission to save feedback for this session.',
                })
            }

            await query(
                `
          UPDATE sessions 
          SET counsellor_feedback = $1
          WHERE session_id = $2
      `, [feedback, sessionId]
            )

            res
                .status(200)
                .json({ message: "Counsellor's feedback updated successfully" })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },
}