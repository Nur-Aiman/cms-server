const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = {
  authenticateToken: function authenticateToken(req, res, next) {
    const token = req.cookies.access_token
    console.log('Token from cookies:', token)
    // console.log('all req send', req)

    if (!token) {
      res.locals.message = 'Please log in'
      setTimeout(() => {
        console.log('login fail (no token)')
        res.redirect('/api/users/login')
      }, 1000)
    } else {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          res.locals.message = 'Please log in'
          setTimeout(() => {
            console.log('login fail (token cannot verify)')
            res.redirect('/api/users/login')
          }, 1000)
        } else {
          req.user = user
          next()
        }
      })
    }
  },
}
