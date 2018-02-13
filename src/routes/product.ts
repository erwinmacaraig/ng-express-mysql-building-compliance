import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Cart } from '../models/cart.model';
import * as fs from 'fs';
import * as moment from 'moment';

import { Product } from '../models/product.model';
import { ProductsRelationModel } from '../models/products.relation.model';
import { ProductsFavoritesModel } from '../models/products.favorites.model';
import { DiagramFinishModel } from '../models/diagram.finish.model';
import { AuthRequest } from '../interfaces/auth.interface';

export class ProductRoute extends BaseRoute {
    constructor() {
        super();
    }
    public static create(router: Router) {
        router.get('/product/list',  new MiddlewareAuth().authenticate, (req, res, next) => {
            new ProductRoute().generateProductList(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem generating the product listing.'
                });
            });
        });

        router.post('/product/add-to-cart',  new MiddlewareAuth().authenticate, (req, res) => {
            new ProductRoute().addToCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem adding item to cart'
                });
            });
        });

        router.post('/product/update-cart',  new MiddlewareAuth().authenticate, (req, res) => {
            new ProductRoute().updateCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem updating item to cart'
                });
            });
        });

        router.get('/product/remove-from-cart/:product_id',  new MiddlewareAuth().authenticate, (req, res) => {
            new ProductRoute().removeFromCart(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((e) => {
                return res.status(400).send({
                    message: 'There was a problem removing item to cart'
                });
            });
        });

        router.get('/products/get-all',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().getAllProducts(req, res);
        });

        router.get('/products/get-cart',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().getCart(req, res);
        });

        router.get('/product/remove-all-from-cart/',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            req['session'].cart = {
                items : {},
                totalQty : 0,
                totalPrice : 0
            };
            res.send({
                cart: req['session'].cart
            });
        });

        router.get('/packages-products',   new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().getPackagesAndProducts(req, res);
        });

        router.get('/products/get-favorites/:user_id',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().getFavorites(req, res);
        });

        router.post('/products/add-to-favorites',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().addToFavorites(req, res);
        });

        router.post('/products/remove-favorite',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().removeFavorite(req, res);
        });

        router.post('/products/update-favorite',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().updateFavorite(req, res);
        });

        router.get('/products/diagram-finishes',  new MiddlewareAuth().authenticate, (req : AuthRequest, res : Response) => {
            new ProductRoute().getDiagramFinishes(req, res);
        });

    }

    public async addToCart(req, res: Response) {
        const product_id = req.body.product_id;
        const quantity = req.body.quantity;
        const location_id = (req.body.location_id) ? req.body.location_id : 0;
        const diagram_finish_id = (req.body.diagram_finish_id) ? req.body.diagram_finish_id : 0;
        const pdf_only = (req.body.pdf_only) ? req.body.pdf_only : 0;
        const target_user_id = (req.body.target_user_id) ? req.body.target_user_id : 0;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();

            productDbData['qty'] = quantity;
            productDbData['location_id'] = location_id;
            productDbData['diagram_finish_id'] = diagram_finish_id;
            productDbData['pdf_only'] = pdf_only;
            productDbData['target_user_id'] = target_user_id;

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
        const diagram_finish_id = (req.body.diagram_finish_id) ? req.body.diagram_finish_id : 0;
        const pdf_only = (req.body.pdf_only) ? req.body.pdf_only : 0;
        const target_user_id = (req.body.target_user_id) ? req.body.target_user_id : 0;
        const cart = new Cart(req.session.cart ? req.session.cart : {});
        try {
            const product = new Product(product_id);
            const productDbData = await product.load();

            productDbData['qty'] = quantity;
            productDbData['location_id'] = location_id;
            productDbData['diagram_finish_id'] = diagram_finish_id;
            productDbData['pdf_only'] = pdf_only;
            productDbData['target_user_id'] = target_user_id;

            cart.update(productDbData, product.ID());
            req.session.cart = cart;

            return {
                message: 'Success. Product update from cart.',
                cart: cart
            };
        } catch (e) {
            return {
                message: 'Fail. There was a problem updating the product to cart.',
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

    public async getAllProducts(req : AuthRequest, res : Response){
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

    public async getPackagesAndProducts(req : AuthRequest, res : Response){
        let response = {
            status : true, data : <any>[], message : ''
        },
        productsRelationModel = new ProductsRelationModel();

        response.data = await productsRelationModel.getPackagesAndProducts();

        res.send(response);
    }

    public async getFavorites(req : AuthRequest, res : Response){
        let
        userId = req.params.user_id,
        response = {
            status : true, data : <any>[], message : ''
        },
        favoritesModel = new ProductsFavoritesModel();

        response.data = await favoritesModel.getUsersFavorites(userId);
        res.send(response);
    }

    public async addToFavorites(req : AuthRequest, res : Response){
        let
        userId = req.body.user_id,
        qty = parseInt(req.body.quantity),
        productId = req.body.product_id,
        locationId = req.body.location_id,
        targetUserId = (req.body.target_user_id) ? req.body.target_user_id : 0,
        diagramFinishId = (req.body.diagram_finish_id) ? req.body.diagram_finish_id : 0,
        pdfOnly = (req.body.pdf_only) ? req.body.pdf_only : 0,
        response = {
            status : true, data : <any>[], message : ''
        },
        getFavoritesModel = new ProductsFavoritesModel(),
        usersFavorites = await getFavoritesModel.getUsersFavorites(userId),
        favoritesModel = new ProductsFavoritesModel(),
        alreadyHave = false;

        for(let i in usersFavorites){
            if(usersFavorites[i]['product_id'] == productId && usersFavorites[i]['user_id'] == userId){
                alreadyHave = true;
            }
        }

        if(alreadyHave){
            response.status = false;
            response.message = 'Already have this to favorites';
        }else{
            await favoritesModel.create({
                product_id : productId,
                user_id : userId,
                quantity : qty,
                location_id : locationId,
                target_user_id : targetUserId,
                diagram_finish_id : diagramFinishId,
                pdf_only : pdfOnly
            });
        }

        let getNewFavoritesModel = new ProductsFavoritesModel();
            response.data = await getNewFavoritesModel.getUsersFavorites(userId);

        res.send(response);
    }

    public async removeFavorite(req : AuthRequest, res : Response){
        let
        userId = req.body.user_id,
        productId = req.body.product_id,
        response = {
            status : true, data : <any>[], message : ''
        },
        getFavoritesModel = new ProductsFavoritesModel(),
        usersFavorites = await getFavoritesModel.getUsersFavorites(userId),
        favoritesModel = new ProductsFavoritesModel(),
        alreadyHave = false;

        for(let i in usersFavorites){
            if(usersFavorites[i]['product_id'] == productId && usersFavorites[i]['user_id'] == userId){
                favoritesModel.setID(usersFavorites[i]['products_favorites_id']);
                await favoritesModel.delete();
            }
        }

        let getNewFavoritesModel = new ProductsFavoritesModel();
            response.data = await getNewFavoritesModel.getUsersFavorites(userId);

        res.send(response);
    }


    public async updateFavorite(req : AuthRequest, res : Response){
        let
        userId = req.body.user_id,
        qty = parseInt(req.body.quantity),
        productId = req.body.product_id,
        locationId = req.body.location_id,
        targetUserId = (req.body.target_user_id) ? req.body.target_user_id : 0,
        diagramFinishId = (req.body.diagram_finish_id) ? req.body.diagram_finish_id : 0,
        pdfOnly = (req.body.pdf_only) ? req.body.pdf_only : 0,
        response = {
            status : true, data : <any>[], message : ''
        },
        getFavoritesModel = new ProductsFavoritesModel(),
        usersFavorites = await getFavoritesModel.getUsersFavorites(userId),
        favoriteModel,
        hasRecord = false;


        for(let i in usersFavorites){


            if(usersFavorites[i]['product_id'] == productId && usersFavorites[i]['user_id'] == userId){

                favoriteModel = new ProductsFavoritesModel(usersFavorites[i]['products_favorites_id']);
                favoriteModel.set('quantity', qty);
                favoriteModel.set('product_id', productId);
                favoriteModel.set('user_id', userId);
                favoriteModel.set('location_id', locationId);
                favoriteModel.set('target_user_id', targetUserId);
                favoriteModel.set('diagram_finish_id', diagramFinishId);
                favoriteModel.set('pdf_only', pdfOnly);

                await favoriteModel.dbUpdate();
            }
        }

        let getNewFavoritesModel = new ProductsFavoritesModel();
            response.data = await getNewFavoritesModel.getUsersFavorites(userId);

        res.send(response);
    }

    public async getDiagramFinishes(req : AuthRequest, res : Response){
        let diagramModel = new DiagramFinishModel();

        res.send({
            status : true,
            data : await diagramModel.getAll(),
            message : ''
        });
    }

}
