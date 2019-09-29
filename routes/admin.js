const express = require('express')
const dir = require('../util/path')
const path = require('path')
const router = express.Router()
const adminController = require('../controller/admin')
const authed = require('../authed/authed');
const {
    body
} = require('express-validator/check');

router.get('/add-product', authed, adminController.getAddProduct);

router.get('/product-list', authed, adminController.getProducts)

// /admin/add-product => POST
router.post('/add-product', [
    body('title')
    .isString()
    .isLength({
        min: 3
    })
    .trim(),
    body('price').isFloat(),
    body('description')
    .isLength({
        min: 5,
        max: 400
    })
    .trim()
], adminController.postAddProduct);

router.get('/edit-product/:productId', authed, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
    .isLength({
        min: 3
    })
    .trim(),
    body('price').isFloat(),
    body('description')
    .isLength({
        min: 5,
        max: 400
    })
    .trim()
], authed, adminController.postEditProduct);
router.post('/delete-product', adminController.postDeleteProduct)

module.exports = router;