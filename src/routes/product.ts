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

  }

  public async addToCart(req, res: Response) {
    const product_id = req.params.product_id;
    const cart = new Cart(req.session.cart ? req.session.cart : {});
    try {
      const product = new Product(product_id);
      const productDbData = await product.load();
      cart.add(productDbData, product.ID());
      req.session.cart = cart;
      console.log(req.session.cart);
      return {
        message: 'Success. Product added to cart.',
        cart: cart
      };
    } catch (e) {
      console.log(req.session.cart);
      return {
        message: 'Fail. There was a problem adding the product to cart.',
        cart: cart
      };
    }
  }
  public async generateProductList(req, res) {
    const product = new Product();
    const list = await product.listProducts();
    return list;
  }
}
