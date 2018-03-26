import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as fs from 'fs';
import { Product } from '../models/product.model';
import { Cart } from '../models/cart.model';
import { Translog } from '../models/translog.model';
import { Transaction } from '../models/transaction.model';
import { Gateway } from '../models/gateway.model';
import { AuthRequest } from '../interfaces/auth.interface';

const defs = require('../config/defs');
import * as url from 'url';


import * as paypal from 'paypal-rest-sdk';
import { fail } from 'assert';

import * as CryptoJS from 'crypto-js';


export class PaymentRoute extends BaseRoute {
  constructor() {
    super();
  }


  public static async create(router: Router) {
    let config;
    const gateway = new Gateway();
    try{
      config = await gateway.getActiveConfig();
      if (config['gateway_code'] === 'paypal') {
        const paypal_config = {
          'port': 5000,
          'api': {
            'host': config['gateway_url'],
            'port': '',
            'client_id': config['gateway_username'],
            'client_secret': config['gateway_password']
          }
        };
        paypal.configure(paypal_config.api);
      }
    }catch(e){
      console.log(e);
    }
    
    router.get('/payment/shopping-cart/', new MiddlewareAuth().authenticate, (req, res, next) => {
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

    router.post('/payment/paynow/', new MiddlewareAuth().authenticate, (req, res) => {
      if (!req['session']['cart']) {
        return res.status(400).send({
          message: 'Cart empty'
        });
      }
      let translog_id = 0;
      const transLog = new Translog();
      const product_items =  req['session']['cart']['items'];

      transLog.create({}).then((txnLog) => {
        translog_id = transLog.ID();

        new PaymentRoute().setupTransaction(product_items, translog_id, req.body.user_id).then(() => {
          const payment = {
            'intent': 'sale',
            'payer': {
              'payment_method': 'paypal'
            },
            'redirect_urls': {
              'return_url': `${config['host_return_url']}${translog_id}/`,
              'cancel_url': `${config['host_cancel_url']}${translog_id}/`
            },
            'transactions': [{
              'amount': {
                'total': parseFloat(req.body.amount),
                'currency':  req.body.currency.toString() || 'AUD'
              },
              'description': req.body.description || ''
            }]
          };
          
          paypal.payment.create(payment, (error, paymentMade) => {
            if (error) {
              console.log(error);
              transLog.create({
                'gateway_response_state': error.response.error + ':' + error.response.error_description
              }).then(() => {
                return res.status(400).send(error.response);
              });

            } else {
              if (payment.payer.payment_method === 'paypal') {
                req['paymentId'] = paymentMade.id;
                let redirectUrl;
                 
                for (let i = 0; i < paymentMade.links.length; i++) {
                  const link = paymentMade.links[i];
                  if (link.method === 'REDIRECT') {
                    redirectUrl = link.href;
                  }
                }
                res.send({
                  'status' : true, 'redirectUrl' : redirectUrl
                });
              }
            }
          });
        }).catch((e) => {
          console.log(`There was a problem recording transaction`, e);
          return res.status(400).send({
            status: fail,
            error: e
          });
        });
      }).catch((e) => {
        console.log('There was an unknown error', e);
        return res.status(400).send(
          {
            status: fail,
            error: e
          }
        );
      });
    });

    router.get('/payment/paypal/cancel/:translogId/', (req, res) => {
      const translogID = req.params.translogId;
      const txnLog = new Translog(translogID);
      const log = {
        'translog_id': translogID,
        'payment_gateway': 'paypal',
        'sent_to_gateway': 1,
        'gateway_response_token': req.query.token,
        'status': defs['PAYMENT_CANCELLED']
      };
      txnLog.create(log).then((data) => {
        console.log('Transaction created');
        txnLog.markTransactions(defs['PAYMENT_CANCELLED']).then((db) => {
          console.log('Transactions marked as cancelled');
          res.redirect('/shop/cart');
        }).catch((e) => {
          console.log('Cannot mark transactions', e);
        });
      }).catch((e) => {
        console.log('cannot create transaction', e);
        res.redirect('/shop/cart');
      });
    });

    router.get('/payment/paypal/success/:translogId/', (req, res) => {
      const translogID = req.params.translogId;
      const txnLog = new Translog(translogID);
      const log = {
        'translog_id': translogID,
        'payment_gateway': 'paypal',
        'sent_to_gateway': 1,
        'gateway_response_token': req.query.token,
        'gateway_response_payment_id': req.query.paymentId
      };

      paypal.payment.execute(req.query.paymentId, {
        'payer_id': req.query.PayerID
      }, (error, payment) => {
        console.log('payment', payment);
        req['session']['cart'] = null;
        if (error) {
          console.log(error);
          log['status'] = defs['PAYMENT_FAILED'];
          log['gateway_response_state'] = error.response.name + ':' + error.response.message;
          txnLog.load().then((txnlogData) => {
            if (txnlogData['status'] != 1) {
              txnLog.create(log).then((data) => {
                res.redirect('/payment-response/5');
              }).catch((e) => {
                res.redirect('/payment-response/6');
              });
            } else {
              return res.status(400).send(error.response);
            }
          }).catch((e) => {
            res.redirect('/payment-response/7');
          });
        } else {
          log['status'] = 1;
          log['gateway_response_state'] = payment.state;
          log['gateway_response_amount'] = payment.transactions[0].amount.total;
          txnLog.load().then((txnlogData) => {
            txnLog.create(log).then((data) => {
              new Transaction().markTransactionAsPaid(txnLog.ID()).then(() => {
                res.redirect('/payment-response/1');
              }).catch((e) => {
                res.redirect('/payment-response/2');
              });
            }).catch((e) => {
              res.redirect('/payment-response/3' );
            });
          }).catch((e) => {
            res.redirect('/payment-response/4');
          });
        }
      }
      );
    });
  }

  // route specific methods
  public async setupTransaction(items: any, translog: number, user_id: number) {

    await Object.keys(items).forEach((key) => {
      const transaction = new Transaction();

      if(items[key]['qty']){
        try {

          transaction.create({
            'user_id': user_id,
            'translog_id': translog,
            'product_id': key,
            'quantity': items[key]['qty'],
            'amount': items[key]['price'],
            'expiration_date' : (items[key]['item']['expiration_date']) ? items[key]['item']['expiration_date'] : null,
            'location_id' : (items[key]['item']['location_id']) ? items[key]['item']['location_id'] : 0,
            'account_id' : (items[key]['item']['account_id']) ? items[key]['item']['account_id'] : 0,
            'status' : (items[key]['status']) ? items[key]['status'] : 0
          });

        } catch (e) {
          console.log(`Cannot process item ${key}`, );
        }
      }

    });
    return;
  }


}
