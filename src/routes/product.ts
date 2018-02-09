import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Cart } from '../models/cart.model';
import * as fs from 'fs';
import * as moment from 'moment';

import { Product } from '../models/product.model';
import { ProductsRelationModel } from '../models/products.relation.model';

export class ProductRoute extends BaseRoute {
    constructor() {
        super();
    }
    public static create(router: Router) {
        router.get('/product/list', (req, res, next) => {
            new ProductRoute().generateProductList(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem generating the product listing.'
                });
            });
        });

        router.post('/product/add-to-cart', (req, res) => {
            new ProductRoute().addToCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem adding item to cart'
                });
            });
        });

        router.post('/product/update-cart', (req, res) => {
            new ProductRoute().updateCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem updating item to cart'
                });
            });
        });

        router.get('/product/remove-from-cart/:product_id', (req, res) => {
            new ProductRoute().removeFromCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem removing item to cart'
                });
            });
        });

        router.get('/products/get-all', (req : Request, res : Response) => {
            new ProductRoute().getAllProducts(req, res);
        });

        router.get('/products/get-cart', (req : Request, res : Response) => {
            new ProductRoute().getCart(req, res);
        });

        router.get('/product/remove-all-from-cart/', (req : Request, res : Response) => {
            req['session'].cart = {
                items : {},
                totalQty : 0,
                totalPrice : 0
            };
            res.send({
                cart: req['session'].cart
            });
        });

        router.get('/packages-products',  (req : Request, res : Response) => {
            new ProductRoute().getPackagesAndProducts(req, res);
        });

    }

    public async addToCart(req, res: Response) {
        const product_id = req.body.product_id;
        const quantity = req.body.quantity;
        const location_id = (req.body.location_id) ? req.body.location_id : 0;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();

            productDbData['qty'] = quantity;
            productDbData['location_id'] = location_id;

            if(productDbData['product_type'] == 'package'){
                if(productDbData['months_of_validity'] > 0){
                    let dateMoment = moment();
                    dateMoment.add( productDbData['months_of_validity'], 'months' );
                    productDbData['expiration_date'] = dateMoment.format('YYYY-MM-DD');
                }
            }

            cart.add(productDbData, product.ID());
            req.session.cart = cart;

            return {
                message: 'Success. Product added to cart.',
                cart: cart
            };
        } catch (e) {
            console.log(e);
            return {
                message: 'Fail. There was a problem adding the product to cart.',
                cart: cart
            };
        }
    }

    public async updateCart(req, res: Response) {
        const product_id = req.body.product_id;
        const quantity = req.body.quantity;
        const location_id = (req.body.location_id) ? req.body.location_id : 0;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();

            productDbData['qty'] = quantity;
            productDbData['location_id'] = location_id;

            cart.update(productDbData, product.ID());
            req.session.cart = cart;

            return {
                message: 'Success. Product added to cart.',
                cart: cart
            };
        } catch (e) {
            return {
                message: 'Fail. There was a problem adding the product to cart.',
                cart: cart
            };
        }
    }

    public async removeFromCart(req, res: Response) {
        const product_id = req.params.product_id;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();
            cart.remove(productDbData, product.ID());
            if( Object.keys(cart.items).length == 0 ){
                cart.totalPrice = 0;
                cart.totalQty = 0;
            }
            req.session.cart = cart;

            return {
                message: 'Success. Product removing from cart.',
                cart: cart
            };
        } catch (e) {
            
            return {
                message: 'Fail. There was a problem removing the product to cart.',
                cart: cart
            };
        }
    }

    public async generateProductList(req, res) {
        const product = new Product();
        const list = await product.listProducts();
        return list;
    }

    public async getAllProducts(req : Request, res : Response){
        let productModel = new Product(),
            response = {
                status : true, data : <any>[], message : ''
            };

        response.data = await productModel.listProducts();

        res.statusCode = 200;
        res.send(response);
    }

    public async getCart(req, res : Response){
        let cartModel = new Cart(req.session.cart ? req.session.cart : {}),
            response = {
                status : true, data : <any>[], message : ''
            };        
            
        response.data = (req.session.cart !== undefined) ? req.session.cart : {
            items : {},
            totalQty : 0,
            totalPrice : 0
        };

        res.statusCode = 200;
        res.send(response);
    }

    public async getPackagesAndProducts(req : Request, res : Response){
        let response = {
            status : true, data : <any>[], message : ''
        },
        productsRelationModel = new ProductsRelationModel();

        response.data = await productsRelationModel.getPackagesAndProducts();

        res.send(response);
    }
}
