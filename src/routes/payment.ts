import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as fs from 'fs';
import { Product } from '../models/product.model';
import { Cart } from '../models/cart.model';

import * as paypal from 'paypal-rest-sdk';


export class PaymentRoute extends BaseRoute {
  constructor() {
    super();
  }
  public static create(router: Router) {
    const paypal_config = {
      'port': 5000,
      'api': {
        'host': 'api.sandbox.paypal.com',
        'port': '',
        'client_id': 'AY2watczj38urmMmH0B5OYXzy2YHIi1ZagBnrMcYvofxXOfPrlIst0toySBZYcmVkTmvp_KEffzOK7yJ',
        'client_secret': 'EHUv6kRUZ1j_QlK2NjRm47iSoQhYs_rgoX1juQ7_gui7sbvmgK4EmXi23MoHTEgKUdcgEjgptf0E0Liq'
      }
    };
    paypal.configure(paypal_config.api);

    router.get('/payment/shopping-cart/', (req, res, next) => {
      if (!req['session']['cart']) {
        return res.status(400).send({
          message: 'Cart empty'
        });
      } else {
        const cart = new Cart(req['session']['cart']);
        return res.status(200).send({
          products: cart.generateArray(),
          totalPrice: cart.totalPrice,
          totNumItems: cart.totalQty
        });
      }
    });

    router.post('/payment/paynow/', (req, res) => {



      const payment = {
        'intent': 'sale',
        'payer': {
          'payment_method': 'paypal'
        },
        'redirect_urls': {
          'return_url': `http://localhost:3000/payment/paypal/success/`,
          'cancel_url': 'http://localhost:3000/payment/paypal/cancel/'
        },
        'transactions': [{
          'amount': {
            'total': parseInt(req.body.amount, 10),
            'currency':  req.body.currency.toString()
          },
          'description': req.body.description
        }]
      };
      paypal.payment.create(payment, (error, paymentMade) => {
        if (error) {
          console.log(error.response.details);
        } else {
          if (payment.payer.payment_method === 'paypal') {
            req['paymentId'] = paymentMade.id;
            console.log(`payment id at this point is ${paymentMade.id}`);
            let redirectUrl;
            console.log(paymentMade);
            for (let i = 0; i < paymentMade.links.length; i++) {
              const link = paymentMade.links[i];
              if (link.method === 'REDIRECT') {
                redirectUrl = link.href;
              }
            }
            res.redirect(redirectUrl);
          }
        }
      });
    });

    router.get('/payment/paypal/success/:translogId', (req, res) => {
      const translogID = req.params.translogId;
      console.log(`Translog id is ${translogID}`);

      paypal.payment.execute(req.query.paymentId, {
        'payer_id': req.query.PayerID
      }, (error, payment) => {
        console.log('payment', payment);
        console.log('payment.transactions.amount', payment.transactions[0].amount);
        console.log('payment.transactions.item_list', payment.transactions[0].item_list);
        console.log('payment.transactions.related_resources', payment.transactions[0].related_resources);

        req['session']['cart'] = null;
        if (error) {
          console.log(error);
          return res.status(400).send({
            message: 'Payment made but no record of transaction can be made.'
          });
        } else {
          return res.status(200).send({
            message: 'Payment successfully recorded.'
          });
        }
      }
      );
    });
  }



  // route specific methods


}
