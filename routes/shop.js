const express = require('express')
const dir = require('../util/path')
const path = require('path')
const route = express.Router()

const shopController = require('../controller/shop')

const authed = require('../authed/authed');

route.get('/', shopController.getIndex);


route.get('/product', shopController.getProduct);
route.get('/product/:productId', shopController.getProductDetail);

route.get('/cart', authed, shopController.getCart);
route.post('/cart', authed, shopController.postCart)
route.post('/cart-delete-item', shopController.postCartDeleteProduct)
route.post('/create-order', authed, shopController.postOrder);
route.get('/order', authed, shopController.getOrders)
    // route.get('/login', shopController.getLogin);
    // route.get('/register', shopController.getRegister)
route.get('/order/:orderId', authed, shopController.getInvoice);
route.get('/check-out', authed, shopController.getCheckout);
route.get('/contact');
route.get('/confirmation');
// route.get('/orders', shopController.getOrders);


module.exports = route;