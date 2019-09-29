const express = require('express');
const path = require('path');
const dir = require('./util/path');
const exphbs = require('express-handlebars');
// const fs = require('fs')
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const multer = require('multer');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const adminRoute = require('./routes/admin');
const shopRoute = require('./routes/shop');
const auth = require('./routes/auth');

const mongoConnect = require('./util/database').mongoConnect;
const User = require('./model/user');
const app = express();





const MONGODB_URI = 'mongodb://localhost:27017/shopTest11'


const store = new mongodbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

// const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, 'IMG' + '_' + new Date().toISOString() + '_' + file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'omage/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
};
app.engine('hbs', exphbs({
    defaultLayout: 'main-layout',
    layoutsDir: 'views/layouts/',
    extname: 'hbs'
}));
app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
    secret: 'secret session cookie',
    resave: false,
    saveUninitialized: false,
    store: store
}));

// app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            throw new Error(err)
        });
});

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    // res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(shopRoute)
app.use('/admin', adminRoute)

app.use(auth);





app.use((req, res, next) => {
    res.status(404).render('404', {
        title: 'error',
        isLoggedIn: req.session.isLoggedIn
    });
});

app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...);
    // res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isLoggedIn: req.session.isLoggedIn
    });
});

const port = 3000


mongoose.connect(MONGODB_URI)
    .then(result => {

        /////DUMMY USER///
        // User.findOne().then(user => {
        //     if (!user) {
        //         const user = new User({
        //             name: 'Samuel Owad',
        //             email: 'admin@shop.com',
        //             cart: {
        //                 items: []
        //             }
        //         });
        //         user.save();
        //     }
        // })


        app.listen(port);
        console.log('connected')
    })
    .catch(err => {
        console.log(err)
    })