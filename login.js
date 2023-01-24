const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const db  = require('./dbConnection');
const router = express.Router();
const bcrypt = require('bcryptjs');

const secret = 'mysecret';

db.connect();

router.use(express.json());

router.post('/login', (req, res) => {
  const { mobile, password } = req.body;

  // authenticate user
  db.query(
    'SELECT * FROM users WHERE mobile_number = ?',
    [mobile],
    (error, results) => {
      if (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        if (results.length > 0) {
          // compare the provided password with the stored password (using bcrypt or similar)
          if (comparePasswords(password, results[0].password)) {
            // generate access token
            const accessToken = jwt.sign({ mobileNumber: mobile }, secret, { expiresIn: '5m' });
            // generate refresh token
            const refreshToken = jwt.sign({ mobileNumber: mobile }, secret);
            // save refresh token
            // saveRefreshToken(mobileNumber, refreshToken);
            res.json({ access_token: accessToken, refresh_token: refreshToken });
          } else {
            res.status(401).json({ message: 'Invalid mobile number or password' });
          }
        } else {
          res.status(401).json({ message: 'Invalid mobile number or password' });
        }
      }
    }
  );
});

// function to compare passwords
function comparePasswords(password, hash) {
  return bcrypt.compareSync(password, hash);
}
