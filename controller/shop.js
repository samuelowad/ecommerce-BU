const Product = require('../model/product');
const Order = require('../model/order')
const User = require('../model/user');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit')

const ITEMS_PER_PAGE = 2


////Login//
// exports.getLogin = (req, res, next) => {
//     User.findById()
//         .then(user => {
//             req.user = user;
//             res.render('login', {
//                 // prods: products,
//                 title: 'Register',
//                 path: '/product',
//                 // hasProduct: products.length > 0,
//                 activeShop: true
//             })
//             next();
//         })
//         .catch(err => {
//             // console.log(err);
//         });
// }

////Registration//



////shopJs /////

exports.getIndex = (req, res, next) => {
    const page = req.query.page;
    let totalItems;
    Product.find().countDocuments().then(numProducts => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        }).then(products => {
            res.render('index', {
                prods: products,
                title: 'Ecommerce Site',
                path: '/',
                hasProduct: products.length > 0,
                activeHome: true,
                isLoggedIn: req.session.isLoggedIn,
                // totalItems:totalItems,
                currentPage: page,
                nextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPrevious: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
        });
}


exports.getProduct = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments().then(numProducts => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        }).then(products => {
            res.render('category', {
                prods: products,
                title: 'products',
                path: '/',
                hasProduct: products.length > 0,
                activeHome: true,
                isLoggedIn: req.session.isLoggedIn,
                // totalItems:totalItems,
                currentPage: page,
                nextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPrevious: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                page1: page != 1,
                last: Math.ceil(totalItems / ITEMS_PER_PAGE) !== page && page + 1 !== Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch(err => {
            console.log(err);
        });
}

// exports.getCart = (req, res, next) => {
//     req.user.getCart()
//         .then(products => {
//             // Product.fetchAll(products => {

//             //     const cartProducts = [];
//             //     for (product of products) {
//             //         const cartProductData = cart.products.find(prod => prod.id === product.id)
//             //         if (cartProductData) {
//             //             cartProducts.push({
//             //                 productData: product,
//             //                 qty: cartProductData.qty,

//             //                 t: cart.totalPrice

//             //             });
//             //         }
//             //     }
//             res.render('cart', {

//                 title: 'Cart ',
//                 path: '/cart',
//                 products: products,
//                 hasProduct: cartProducts.length > 0,
//                 activeShop: true,

//             });
//         })
//         .catch(err => console.log(err));

// }

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price
            })
            res.render('cart', {

                title: 'Cart ',
                path: '/cart',
                products: products,
                hasProduct: products.length > 0,
                activeShop: true,
                isLoggedIn: req.session.isLoggedIn,
                total: total,
            });
        })
        .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log(result);

            res.redirect('/cart');
        });
};
exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        })
}

///////from check out page to orders page to order now
exports.getOrders = (req, res, next) => {
    Order.find({
        "user.userId": req.user._id
    })

    .then(orders => {
        res.render('order', {
            // prods: products,
            title: 'Orders ',
            path: '/orders',
            orders: orders,
            hasProduct: orders.length > 0,
            activeShop: true,
            isLoggedIn: req.session.isLoggedIn,
        });
    })
}

//////////from order now 



exports.getCheckout = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price
            })
            res.render('checkout', {

                title: 'checkout ',
                path: '/cart',
                products: products,
                hasProduct: products.length > 0,
                activeShop: true,
                isLoggedIn: req.session.isLoggedIn,
                not: !req.session.isLoggedIn,
                total: total
            });
        })
        .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: {
                        ...i.productId._doc
                    }
                }
            });
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })

    .then(result => {
            return req.user.clearCart();

        })
        .then(() => {
            res.redirect('/order')
        }).catch(err => console.log(err))
}

exports.getProductDetail = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {

            res.render('product-detail', {
                product: product,
                title: product.title,
                activeShop: true,
                path: '/shop',
                isLoggedIn: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err)
        })

}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (!order) {
            return next(new Error('No Order Found'))
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text('Invoice Report', {
            underline: true
        });
        pdfDoc.text('-------------------------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += totalPrice + prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title + '-' + prod.quantity + ' x ' + '₦' + prod.product.price)
        })
        pdfDoc.text('Total Price : ₦' + totalPrice)
        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        //     res.send(data)
        // })
        // const file = fs.createReadStream(invoicePath);

        // file.pipe(res);
    }).catch(err => next(err));

}