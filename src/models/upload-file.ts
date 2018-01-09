import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';
import * as AWS from 'aws-sdk';
import * as promise from 'promise';

const AWSCredential = require('../config/aws-access-credentials.json');

export class FileUploader {
    res: Response;
    req: Request;
    next: NextFunction;
    private uploader;
    private aws_bucket_name;
    private aws_s3;
    private storageConfig;
    public filename;
    public extname = '';
    private uploadDir = this.getUploadDir();
    // private DIR = '/home/ubuntu/EvacPlatform/evacconnect/uploads/';
    private DIR = './uploads/';

    constructor(req: Request, res: Response, next: NextFunction) {
      this.req = req;
      this.res = res;
      this.next = next;
      this.setAWS_S3();

      this.storageConfig = multer.diskStorage({
        destination: (rq, file, callback) => {
          callback(null, this.DIR);
        },
        filename: (rq, file, callback) => {
          this.extname = this.getFileExtension(file.originalname);
          this.filename = this.generateRandomChars(50) + '.' + this.extname;
          callback(null, this.filename);
        }
      });

    }

    public getUploadDir(){
      let currentDir = String.raw``+__dirname,
        separator = (currentDir.indexOf('/') > 0) ? '/' : "\\",
        arr = currentDir.split(separator),
        dir = '',
        bSave = true;

      arr.forEach((val) => {
        if(val == 'dist'){
          bSave = false;
        }
        if(bSave){
          dir += val + separator;
        }
      });
      dir += 'uploads'+separator;
      console.log(dir);
      return dir;
    }

    /**
    * To generate random characters
    * @return {String} characters
    */
    public generateRandomChars(length){
        let chars = 'ABCDEFGHIJKKLMNOPQRSTUVWXYZ0987654321',
        len = (typeof length == 'number') ? length : 15,
        responseCode = '';

        for(let i=0; i<=len; i++){
           responseCode += chars[ Math.floor(Math.random() * chars.length) ];
        }

        return responseCode;
    }

    public getFileExtension(filename?:String){
      let ext = 'jpg';
      if(filename){
        let arr = filename.split('.'),
          len = arr.length;
        if(len > 0){
          ext = arr[ len - 1 ];
        }
      }
      return ext.toLowerCase();
    }

    private setAWS_S3() {
      AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
      AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
      AWS.config.region = AWSCredential.AWS_REGION;
      this.aws_bucket_name = AWSCredential.AWS_Bucket;
      this.aws_s3 = new AWS.S3();
    }

    public uploadFileToLocalServer(multi: boolean = false) {
      return new Promise((resolve, reject) => {
        if (!multi) {
          this.uploader = multer({
            storage: this.storageConfig
          }).single('file');
        } else {
          this.uploader = undefined;
        }
        this.uploader(this.req, this.res, (err) => {
          if (err) {
            console.log(err, 'there was an internal problem');
            reject(err);
            throw err;
          }
          resolve(this.DIR + this.filename);
        });
      });
    }

    public uploadFile(multi: boolean = false) {
      return new Promise((resolve, reject) => {
        if (!multi) {
          this.uploader = multer({storage: this.storageConfig}).single('file');
        } else {
          this.uploader = undefined;
        }
        this.uploader(this.req, this.res, (err) => {
          if (err) {
            console.log(err, 'there was an internal problem');
            throw err;
          }

          fs.readFile(this.req['file']['path'], (error, data) => {
            if (error) {
              console.log('There was a problem reading the uploaded file ', error);
              return '';
            } else {
              const params = {
                Bucket: this.aws_bucket_name,
                Key: this.filename,
                ACL: 'public-read',
                Body: data
              };

              this.aws_s3.putObject(params, (e, d) => {
                if (e) {
                  console.log('error reading file from path ', this.req['file']['path']);
                  reject('Cannot upload file. Error reading file from path ' + this.req['file']['path']);
                } else {
                  resolve('File upload successful');
                  fs.unlink(this.uploadDir+this.filename, () => {});
                  /*
                  this.aws_s3.getSignedUrl('getObject', {
                    Bucket: this.aws_bucket_name,
                    Key: this.filename
                  }, (ers, url) => {
                    if ( ers ) {
                      console.log('There was a problem getting the file from s3 ', ers);
                      throw ers;
                    }
                    console.log(url);
                    return url;
                  });
                  */
                } // end else
              }); // end putObject
            } // end of reading bytes of the file
          }); // end of fsread
        }); // end of uploader
      }); // end of promise
    } // end of method call

    public getUploadedFileLocation(): string {
      console.log(this.filename);
      return AWSCredential.AWS_S3_ENDPOINT_URL + this.filename;
    }


}
