import { NextFunction, Request, Response } from 'express';

/**
 * Constructor
 *
 * @class BaseRoute
 */
 export class BaseRoute {
  /**
   * Constructor
   *
   * @class BaseRoute
   * @constructor
   */
   constructor() {
   }

  /**
   * Render a page.
   *
   * @class BaseRoute
   * @method render
   * @param req {Request} The request object.
   * @param res {Response} The response object.
   * @param view {String} The view to render.
   * @param options {Object} Additional options to append to the view's local scope.
   * @return void
   */
   public render(req: Request, res: Response, view: string, options?: Object) {
       // add constants
       res.locals.BASE_URL = '/';

       // render view
       res.render(view, options);
   }

   public capitalizeFirstLetter(string: String) {
     let result = '',
       splitted = string.split(' ');

       splitted.forEach( function(s){ 
         result += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
       } );
      return result;
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

    public isEmailValid(email) {
      var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    }

    public addChildrenLocationToParent(data){
        for(let i in data){
            if('sublocations' in data[i] == false){
                data[i]['sublocations'] = [];
            }

            for(let x in data){
                if(data[x]['parent_id'] == data[i]['location_id']){
                    if('sublocations' in data[i] == false){
                        data[i]['sublocations'] = [];
                    }

                    let d = {};
                    for(let l in data[x]){
                        if(l.indexOf('@pi') == -1){
                            d[l] = data[x][l];
                        }
                    }

                    data[i]['sublocations'].push(d);
                }
            }
        }

        let finalData = [];
        for(let i in data){
            let hasParent = false;
            for(let x in data){
                if( data[i]['parent_id'] == data[x]['location_id'] ){
                    hasParent = true;
                }
            }
            if(!hasParent){
                finalData.push( data[i] );
            }
        }

        return finalData;
    }
}
