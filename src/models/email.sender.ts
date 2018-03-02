const AWS = require('aws-sdk');
const AWSCredential = require('../config/aws-access-credentials.json');
const path = require('path');
const mime = require('mime-types');

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
            region:'us-east-1',
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
        var
        email = this.buildEmail(),
        params = {
            // RawMessage: { Data: new Buffer(email) },
            Destination: {
              ToAddresses: this.options['to'],
              CcAddresses: this.options['cc']
            },
            Source: "'EvacConnect' <" + this.getOptionToIntoString() + ">'",
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

        /*
        this.ses.sendRawEmail(params, function(err, data) {
            if(err) {
                error(err);
            }
            else {
                success(data);
            }
        });
        */
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


}
