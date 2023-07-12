var express = require('express')
const {
    registerClient,
    viewAppointment,
    loginClient,
    logoutClient,
    viewCounsellors,
    bookAppointment,
    currentUser,
    viewCounsellor,
    makePayment,
    getCounsellorSessions,
} = require('../controllers/clientController')
const { authenticateToken } = require('../middleware/authenticateToken')
const { validateRole } = require('../middleware/validateRole')
var router = express.Router()

router.post('/register', registerClient)
router.post('/login', loginClient)
router.get('/counsellors-view', viewCounsellors)
router.get('/counsellors-view/:id', viewCounsellor)
router.get('/:counsellorId/sessions', authenticateToken, getCounsellorSessions)
router.post('/appointment-book', authenticateToken, validateRole('client'), bookAppointment)
router.get('/appointment-view', authenticateToken, validateRole('client'), viewAppointment)
router.put('/make-payment/:sessionId', authenticateToken, validateRole('client'), makePayment)
router.get('/logout', authenticateToken, validateRole('client'), logoutClient)


module.exports = router