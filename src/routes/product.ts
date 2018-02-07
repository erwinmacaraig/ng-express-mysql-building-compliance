import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Cart } from '../models/cart.model';
import * as fs from 'fs';

import { Product } from '../models/product.model';

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

        router.get('/product/add-to-cart/:product_id', (req, res) => {
            new ProductRoute().addToCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem adding item to cart'
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

        router.post('/product/checkout', (req : Request, res : Response) => {
            
        });

    }

    public async addToCart(req, res: Response) {
        const product_id = req.params.product_id;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();
            cart.add(productDbData, product.ID());
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

        try{
            response.data = (req.session.cart !== null) ? req.session.cart : {
                items : {},
                totalQty : 0,
                totalPrice : 0
            };
        }catch(e){
            console.log(e);
        }

        res.statusCode = 200;
        res.send(response);
    }
}
