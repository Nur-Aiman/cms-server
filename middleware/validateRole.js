var express = require('express')

module.exports = {
    validateRole: function validateRole(role) {
        return function(req, res, next) {
            const userRole = req.user.role
            console.log('User role:', userRole);
            // loggedInUser = req.user
            // console.log("user at validate role middleware", loggedInUser)
            if (userRole === role) {
                next()
            } else {
                res.status(403).json({ error: 'Unauthorized' })
            }
        }
    },
}