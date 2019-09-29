const User = require('../model/user');



const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport')
const crypto = require('crypto');

const {
    validationResult
} = require('express-validator/check')
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}))

exports.getLogin = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null
    }

    res.render('login', {

        // prods: products,
        title: 'Login ',
        path: '/orders',

        // hasProduct: orders.length > 0,
        activeShop: true,
        isLoggedIn: false,
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        }
    });

}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('login', {
            title: 'login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                val: 'validate',
                password: "",

            }
        })
    }
    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password')
                return res.redirect('/login')
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/')
                        });

                    }
                    req.flash('error', 'Invalid email or password.');
                    res.redirect('/login');
                })
                .catch(err => {


                    res.redirect('/login')
                })

        })
        .catch(err => console.log(err));


}


exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err)
        res.redirect('/')
    })
}

exports.getRegister = (req, res, next) => {
    const email = req.body.email;
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('register', {

        // prods: products,
        title: 'Registration Page ',
        path: '/orders',

        // hasProduct: orders.length > 0,
        activeShop: true,
        isLoggedIn: false,
        errorMessage: message,
        oldInput: {
            name: "",
            phone: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: [],
        // val: validationResult(req).array().find(e => e.param === 'email') ? "invalid" : ''
    });
};
exports.postRegister = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('register', {

            // prods: products,
            title: 'Registration Page ',
            path: '/orders',

            // hasProduct: orders.length > 0,
            activeShop: true,
            isLoggedIn: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name: req.body.name,
                phone: req.body.phone,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt.hash(password, 12).then(hashedPassword => {
        const user = new User({
            name: name,
            email: email,
            password: hashedPassword,
            phone: phone,
            cart: {
                items: []
            }

        });
        return user.save();
    })

    .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'shop-test.com',
                subject: 'signup succeeded',
                html: '<h1>you have successfully signed up</h1>'
            })


        }).catch(err => {
            console.log(err)
        })
        .catch(err => {
            console.log(err)
        })
}


exports.getReset = (req, res, nest) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('reset', {
        title: 'Reset Password',
        errorMessage: message
    })
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex');
        User.findOne({
                email: req.body.email
            })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account associated  with that Email')
                    return res.redirect('/reset')
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            }).then(result => {
                res.redirect('/')
                transporter.sendMail({
                    to: req.body.email,
                    from: 'shop-test.com',
                    subject: 'Password reset',
                    html: `
                <p>You request a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset password</p>
                <p>this link is only active for 1(one) hour</p>
                `
                })
            })
            .catch(err => {
                console.log(err)
            })
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        }).then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('new-password', {
                title: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => {
            console,
            log(err)
        });

}


exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: {
            $gt: Date.now()
        },
        _id: userId
    }).then(user => {
        resetUser = user
        return bcrypt.hash(newPassword, 12)
    }).then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    }).then(result => {
        res.redirect('/login');
        return transporter.sendMail({
            to: email,
            from: 'shop-test.com',
            subject: 'Password successfully Updated',
            html: '<h1>you have successfully Updated your Password</h1>'
        })
    }).catch(err => {
        console.log(err)
    })
}