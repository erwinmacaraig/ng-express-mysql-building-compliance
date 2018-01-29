import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as fs from 'fs';
import { Product } from '../models/product.model';


export class PaymentRoute extends BaseRoute {
  constructor() {
    super();
  }
  public static create(router: Router) {

  }
}
