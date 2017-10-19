import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { EmailSender } from '../models/email.sender';

export class AwsRoute extends BaseRoute {

  /**
   * Authenticate User upon Log in
   *
   * @class AwsRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    router.get('/aws-ses/send-to-your/:email', (req: Request, res: Response, next: NextFunction) => {
      let thisAwsRoute = new AwsRoute();

      let opts = {
        from : 'allantaw2@gmail.com',
        fromName : 'Allan Delfin',
        to : [ req.params.email ],
        body : thisAwsRoute.emailSampleHTML(),
        attachments: [],
        subject : 'Hello world test email'
      };

      let email = new EmailSender(opts);

      email.send(
        (data) => { res.send(data); },
        (err) => { res.send(err); }
      );
    });
  }

  /**
   * Constructor
   *
   * @class AwsRoute
   * @constructor
   */
  constructor() {
    super();
  }


  public emailSampleHTML(){
    let email = `
    
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" style="margin: 0px; padding: 0px;">

      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width">
      </head>

      <body>
        
        <table style="margin-left: auto; margin-right: auto; margin-top: 50px; width: 900px; border:1px solid #eee; border-collapse: collapse; font-family:Tahoma; letter-spacing: 0.6px;">
          <tr>
            <td colspan="2" valign="middle" style="text-align: center; font-size:16px; border-bottom: 0px solid #eee; background-color: #607d8b;">
              <h2 style="color: #fff; margin:10px 0px; font-family:Tahoma; letter-spacing: 0.6px;"> My Super Basic Email </h2>
              <h4 style="color: #fff; margin:10px 0px; font-family:Tahoma; letter-spacing: 0.6px;">  </h4>
            </td>
          </tr>

          <tr>
            <td style="padding:20px; background-color: #f9f9f9;">
              
              <table style="border-collapse: collapse;">
                <tr>
                  <td> <h4 style="margin:0px; font-family:Tahoma; letter-spacing: 0.6px;">Hi Sir!</h4>  </td>
                </tr>
                <tr>
                  <td> <p style="margin:0px; font-size: 13px; font-family:Tahoma; letter-spacing: 0.6px;"> Sample tagline here </p>  </td>
                </tr>
              </table>

              <table style="border-collapse: collapse; width:100%; margin-top: 10px; font-size: 12px;">
                <tr>
                  <td>  <h4> This is an example of HTML email. </h4> </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td colspan="2" valign="middle" style="background-color: #607d8b; text-align: center; font-size:14px; border-top: 1px solid #eee;">
              <h5 style="color: #fff; font-family:Tahoma; letter-spacing: 0.6px;">This is an automated email generation by : EvacConnect.</h5>
            </td>
          </tr>
        </table>
         

      </body>

    </html>
    `;

    return email;
  }

}
