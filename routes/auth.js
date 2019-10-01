const express = require('express');
const router = express.Router();
const {check, body } = require('express-validator/check');
const User = require('../model/user');
const authController = require('../controller/auth');


router.get('/login', authController.getLogin)

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password', 'Please enter a password with minimum of 5 characters.').isLength({min: 5}).trim()
], authController.postLogin );


router.post('/logout', authController.postLogout)
router.get('/register', authController.getRegister);
router.post('/register', [check('email').isEmail().withMessage('Please enter a valid email').custom((value, {
        req
    }) => {
        return User.findOne({
            email: value
        }).then(userDoc => {
            if (userDoc) {
                return Promise.reject('E-mail already exists ')
            }
        })
    }).normalizeEmail(),
    body('password', 'Please enter a password with minimum of 5 characters.').isLength({
        min: 5
    }).trim(), body('confirmPassword').trim().custom((value, {
        req
    }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not Match')
        }
        return true;
    })
], authController.postRegister);
router.get('/reset', authController.getReset)
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports = router;
