import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptDecryptService {
  private password = 'NifLed';
  constructor() {
  }

  public encrypt(string) {
    return CryptoJS.AES.encrypt(''  + string + '', this.password).toString().split('/').join('___');
  }

  public decrypt(ecrypted) {
    ecrypted = ecrypted.split('___').join('/');
    const decrypted = CryptoJS.AES.decrypt(ecrypted, this.password);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  public decryptUrlParam(uriComponent) {
    const ecrypted = decodeURIComponent(uriComponent);
    const decrypted = CryptoJS.AES.decrypt(ecrypted, this.password);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }


}
