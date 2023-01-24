const express = require("express");
const router = express.Router();
const db = require("./dbConnection");
const { signupValidation } = require("./validation");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secret = "mysecret";

router.post("/register", signupValidation, (req, res, next) => {
  db.query(
    `SELECT * FROM user WHERE LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: "This user is already in use!",
        });
      } else {
        // username is available
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err,
            });
          } else {
            // has hashed pw => add to database
            db.query(
              `INSERT INTO user (name, email, password, mobile) VALUES ('${
                req.body.name
              }', ${db.escape(req.body.email)}, ${db.escape(hash)},${db.escape(
                req.body.mobile
              )})`,
              (err, result) => {
                if (err) {
                  throw err;
                  return res.status(400).send({
                    msg: err,
                  });
                }
                const accessToken = jwt.sign(
                  { username: req.body.email },
                  secret,
                  { expiresIn: "5m" }
                );
                const refreshToken = jwt.sign(
                  { username: req.body.email },
                  secret
                );
                return res.status(201).send({
                  msg: "The user has been registerd with us!",
                  refreshToken: refreshToken,
                  accessToken: accessToken,
                  userid: result.insertId,
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post("/login", (req, res) => {
  const { mobile, password } = req.body;

  db.query("SELECT * FROM user WHERE mobile = ?", [mobile], (err, result) => {
    if (err) {
      res.status(500).json({ message: "No User Exists" });
    } else {
      console.log(result);
      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (err, result) => {
          if (err) {
            return res.status(409).send({
              msg: "This user is already in use!",
            });
          }
          if (!result) return res.send({ msg: "Invalid" });
          const accessToken = jwt.sign({ mobileNumber: mobile }, secret, {
            expiresIn: "5m",
          });
          const refreshToken = jwt.sign({ mobileNumber: mobile }, secret);
          return res.send({ accessToken:accessToken,refreshToken:refreshToken});
        });
      }
    }
  });
});

router.post('/create',(req,res)=>{
    console.log(req.body);
    const {name, url, amount, modes, currencySymbol}= req.body;
    db.query(`INSERT INTO transactions (name, url, amount, modes, currencySymbol) VALUES ('${req.body.name}',${db.escape(req.body.url)},${db.escape(req.body.amount)},${db.escape(req.body.modes)},${db.escape(req.body.currencySymbol)})`,(err,result)=>{
        if(err){
            throw err;
            return res.status(400).send({
                msg:err,
            })
        }else{
            return res.send({result:result});
        }
    })
})

router.get('/fetch',(req,res)=>{
    const {insertid} = req.body;
    db.query(`SELECT * FROM transactions WHERE id = ?`,[insertid],(err,result)=>{
      if (err) {
        res.status(500).json({ message: "No User Exists" });
      }else{
        if (result.length > 0) {
          return res.send(result[0]);
        }
        else return res.send({msg:"error"});
      }
    })
})

module.exports = router;
