require('dotenv').config();

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // Check if the token exists and is verified
    if (token) {
        jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
            if (err) {
                // Handle the error case, e.g., redirect or send a response
                return res.status(401).json({ error: 'Unauthorized' });
            } else {
                // Token is valid
                req.userId = decodedToken.id;
                res.locals.user = decodedToken.id;


                next();
            }
        });
    } else {
        // Handle the case where no token is provided
        return res.status(401).json({ error: 'Token not provided' });
    }
};



const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, process.env.SECRET, async (err, decodedToken) => {
            if (err) {
                // Handle the error case, e.g., set user to null
                req.user = null;
                return next(); // Continue to the next middleware/route handler
            } else {
                // Token is valid
                let user = await User.findById(decodedToken.id);
                req.user = user;
                res.locals.user = decodedToken.id;
                next();
            }
        });
    } else {
        req.user = null;
        next(); // Continue to the next middleware/route handler
    }
};


module.exports = {requireAuth, checkUser};