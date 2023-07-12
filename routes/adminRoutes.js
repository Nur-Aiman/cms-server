var express = require('express')

const { authenticateToken } = require('../middleware/authenticateToken')
const { validateRole } = require('../middleware/validateRole')
const {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    registerCounsellor,
    viewClients,
    deleteClient,
} = require('../controllers/adminController')
var router = express.Router()

router.post('/login', loginAdmin)
router.get('/clients-view', authenticateToken, validateRole('admin'), viewClients)
router.delete('/deleteClient/:id', authenticateToken, validateRole('admin'), deleteClient)
router.post('/registerCounsellor', authenticateToken, validateRole('admin'), registerCounsellor)
router.post('/register', authenticateToken, validateRole('admin'), registerAdmin)
router.get('/logout', authenticateToken, validateRole('admin'), logoutAdmin)

module.exports = router