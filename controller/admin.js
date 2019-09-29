const Product = require('../model/product');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const fileHelper = require('../util/file');

const {
    validationResult
} = require('express-validator/check');




exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        title: 'add-product',
        // path: '/admin/add-product',
        activeShop: true,
        editing: false,
        admin: true,
        hasError: false,
        errorMessage: null
    })
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if (!image) {

        console.log('not an image');
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    const imageUrl = image.path;;

    const product = new Product({
        title: title,
        price: price,
        image: imageUrl,
        description: description,
        userId: req.user
    });
    product.save()
        .then(result => {
            console.log(`Created Product`);
            res.redirect('/');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });




}

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/')
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/')
            }
            res.render('admin/edit-product', {
                title: 'Edit-product',

                activeShop: true,
                editing: editMode,
                product: product,
                admin: true,
                errorMessage: null
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

// exports.postEditProduct = (req, res, next) => {
//     const prodId = req.body.productId;
//     const updatedTitle = req.body.title;
//     const updatedImage = req.body.image;
//     const updatedPrice = req.body.price;
//     const updatedDescription = req.body.description;
//     const product = new Product(
//         updatedTitle,
//         updatedImage,
//         updatedDescription,
//         updatedPrice,
//         new ObjectId(prodId)
//     );
//     product.save()
//         .then(result => {
//             console.log(`Updated Product`);
//             res.redirect('/admin/product-list');
//         })
//         .catch(err => {
//             console.log(err)
//         });
// }

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId).then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = updatedTitle;

        product.price = updatedPrice;
        product.description = updatedDescription
        if (image) {
            fileHelper.deleteFile(product.imageUrl);
            product.image = image.path;

        }
        return product
            .save().then(result => {
                res.redirect('/admin/product-list');
                console.log('UPDATED PRODUCT!');
            })
    })


    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};


exports.getProducts = (req, res, next) => {
    Product.find({
            userId: req.user._id
        })
        // .select('title price -_id')
        // .populate('userId', 'name')
        .then(products => {
            res.render('admin/product-list', {
                prods: products,
                title: 'Admin Product List ',
                path: '/admin/product-list',
                hasProduct: products.length > 0,
                activeShop: true,
                admin: true
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });;
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({
                _id: prodId,
                userId: req.user._id
            });
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.redirect('/admin/product-list');
        })
        .catch(err => {
            console.log(err)
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};