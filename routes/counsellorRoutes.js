var express = require('express')
const {
    viewAppointments,
    loginCounsellor,
    logoutCounsellors,
    viewAppointmentDetail,
    confirmAppointment,
    closeAppointment,
    bookNextSession,
    preAppointmentNotes,
    counsellorFeedback,
    updateCounsellor,
} = require('../controllers/counsellorController')
const { authenticateToken } = require('../middleware/authenticateToken')
const { validateRole } = require('../middleware/validateRole')
var router = express.Router()


router.post('/login', loginCounsellor)
router.put('/:id', authenticateToken, validateRole('counsellor'), updateCounsellor)
router.get('/appointments', authenticateToken, validateRole('counsellor'), viewAppointments)
router.get('/appointment/:id', authenticateToken, validateRole('counsellor'), viewAppointmentDetail)
router.put('/appointment/:id', authenticateToken, validateRole('counsellor'), confirmAppointment)
router.put('/session/:sessionId/note', authenticateToken, validateRole('counsellor'), preAppointmentNotes);
router.put('/session/:sessionId/feedback', authenticateToken, validateRole('counsellor'), counsellorFeedback);
router.post('/appointment-bookNextSession/:id', authenticateToken, validateRole('counsellor'), bookNextSession)
router.put('/appointment-close/:id', authenticateToken, validateRole('counsellor'), closeAppointment)
router.get('/logout', authenticateToken, validateRole('counsellor'), logoutCounsellors)


module.exports = router