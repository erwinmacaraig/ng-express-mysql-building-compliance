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
}
