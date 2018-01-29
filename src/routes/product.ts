import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
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

  }
  public async generateProductList(req, res) {
    const product = new Product();
    const list = await product.listProducts();
    return list;
  }
}
