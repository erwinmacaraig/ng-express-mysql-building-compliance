import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptDecryptService {
  private password = 'NifLed';
  constructor() {
  }

  public encrypt(string) {
    return CryptoJS.AES.encrypt(''  + string + '', this.password);
  }

  public decrypt(ecrypted) {
    const decrypted = CryptoJS.AES.decrypt(ecrypted, this.password);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }


}
