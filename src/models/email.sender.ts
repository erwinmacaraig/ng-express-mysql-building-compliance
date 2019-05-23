const AWS = require('aws-sdk');
const AWSCredential = require('../config/aws-access-credentials.json');
const mime = require('mime-types');
const defs = require('../config/defs.json');
import * as fs from 'fs';

export class EmailSender {

    public options: Object = {
        from : '',
        fromName : '',
        to : [],
        cc: [],
        body : '',
        attachments: [],
        subject : ''
    };

    private myAccessKeyId:String;
    private mySecretKey:String;

    private ses: any;

    constructor(opts: Object = {}){
        this.myAccessKeyId = AWSCredential.AWSAccessKeyId;
        this.mySecretKey = AWSCredential.AWSSecretKey;

        AWS.config.update({
            region:'us-west-2',
            accessKeyId : this.myAccessKeyId,
            secretAccessKey : this.mySecretKey
        });

        this.assignOptions(opts);
        this.ses = new AWS.SES();
    }

    public assignOptions(opts: Object){
        for(let i in opts){
            if(i in this.options){
                this.options[i] = opts[i];
            }
        }
    }

    private getOptionToIntoString(){
        let text = '',
            counter = 0;
        for(let i in this.options['to']){
            text += this.options['to'][i];
            if( (Object.keys(this.options['to']).length - 1) != counter ){
                text += ';';
            }
            counter++;
        }
        return text;
    }

    private getAttachmentsIntoString(){
        let text = '';
        for(let i in this.options['attachments']){
            let path = this.options['attachments'][i],
                mimeType = mime.lookup( path );

            text += "--NextPart\n";
            text += "Content-Type: "+ mimeType +";\n";
            text += "Content-Disposition: attachment; filename=\""+ path +"\"\n\n";
            text += "--NextPart";
        }
        return text;
    }

    public buildEmail(){
        let email = "From: '"+ this.options['fromName'] +"' <" + this.options['from'] + ">\n";
        email += "To: " + this.getOptionToIntoString() + "\n";
        email += "Subject: "+ this.options['subject'] +"\n";
        email += "MIME-Version: 1.0\n";
        email += "Content-Type: multipart/mixed; boundary=\"NextPart\"\n\n";
        email += "--NextPart\n";
        email += "Content-Type: text/html; charset=us-ascii\n\n";
        email += this.options['body'] + " \n\n";
        email += this.getAttachmentsIntoString();
        return email;
    }

    public async send(success, error){
        let email = this.buildEmail(),
        params = {            
            Destination: {
                ToAddresses: this.options['to'],              
                CcAddresses: this.options['cc'],
                BccAddresses: ['emacaraig@evacgroup.com.au', 'rsantos@evacgroup.com.au']
                /*
                ToAddresses: ['emacaraig@evacgroup.com.au'],
                CcAddresses: ['rsantos@evacgroup.com.au'],
                BccAddresses: ['mmanclark@evacgroup.com.au', 'dgilmore@evacgroup.com.au']                
                */
            }, 
            Source: "'EvacConnect' <" + defs['ADMIN_EMAIL'] + ">'",
            Message: {
              Subject: {
                Charset: 'UTF-8',
                Data: this.options['subject']
              },
              Body: {
                Html: {
                  Charset: 'UTF-8',
                  Data: this.options['body']
                }
              }
            }
        };        
        await this.ses.sendEmail(params, function(err, data) {
          if(err) {
              error(err);
          }
          else {
              success(data);
          }
      });
    }

    public getEmailHTMLHeader(){
        return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" style="margin: 0px; padding: 0px;">

          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width">
          </head>

          <body>`;
    }

    public getEmailHTMLFooter(){
        return `</body></html>`;
    }

    public getVerifiedList() {
      this.ses.listVerifiedEmailAddresses((err, data) => {
        if (err) {
          console.log(err)
          return err;
        } else {
          console.log(data);
          return data;
        }
      });
    }

    public sendFormattedEmail(type, emailData, res, success, error){
        let 
        dir = __dirname.replace('models', 'views'),
        filename = '',
        subj = '';

        switch (type) {
            case "warden-with-online":
                subj = "You are nominated as Warden";
                filename = "warden-with-online";
                break;
            case "warden-without-online":
                subj = "You are nominated as Warden";
                filename = "warden-without-online";
                break;
            case "warden":
                subj = "You are nominated as "+emailData['role'];
                filename = "warden-email";
                break;
            case "general-occupant-with-online":
                subj = "You are nominated as General Occupant";
                filename = "general-occupant-with-online";
                break;
            case "general-occupant-without-online":
                subj = "You are nominated as General Occupant";
                filename = "general-occupant-without-online";
                break;
            case "trp":
                subj = "You are assigned as Tenant Responsible Person";
                filename = "trp-email";
                break;
            case "frp":
                subj = "We invite you to set up your FRP account on EvacConnect";
                filename = "frp-email";
                break;
            case "forgot-password":
                subj = "EvacConnect Change Password";
                filename = "forgot-password-email";
                break;
            case "online-training":
                subj = "You are invited to take an online training on "+emailData['training_name'];
                filename = "online-training-email";
                break;
            case "frp-confirmation":
                subj = "Please confirm you are the nominated Facility Responsible Person";
                filename = "frp-confirmation-email";
                break;
            case "trp-confirmation":
                subj = "Please confirm you are the nominated Tenant Responsible Person";
                filename = "trp-confirmation-email";
                break;
            case "warden-confirmation":
                subj = "Please confirm you are a nominated "+emailData['role'];
                filename = "warden-confirmation-email";
                break;
            case "signup":
                subj = "Your EvacConnect Account: Please verify your email address";
                filename = "signup-email";
                break;
            case "training-invite":
                subj = "EvacConnect Training Invite";
                filename = "training-invite";
                break;
            case "set-passwd-invite":
                subj = "EvacConnect Account Setup";
                filename = "set-passwd-invite";
                break;
            case "send-summary-notification-link":
                subj = "EvacConnect Notification List Summary Link";
                filename = "send-notification-summary-link";
                break;
            case "stay_go_info":
                subj = 'EvacConnect Emergency Evacuation Procedures for Wardens';
                filename = 'info-graphic-email';
                break;
            case "notification-response":
                subj = 'EvacConnect Email Notification - User Response';
                filename = 'user-confirmation-response';
            break;
            
        }

        fs.readFile(dir+'/footer-email.hbs', 'utf8', (err, footer) => {
            emailData['footer'] = footer;

            res.render(filename+'.hbs', emailData, (err, htmlBody) => {

                this.options['subject'] = subj;
                this.options['body'] = htmlBody;

                if (err) {
                    console.log(err);
                }

                this.send(success,error);
            });

        });
    }


}
