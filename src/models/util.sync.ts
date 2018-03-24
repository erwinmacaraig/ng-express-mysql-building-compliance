import {Location} from './location.model';

/**
 * @class
 * @description
 * helper class that do not use Promises
 */
export class UtilsSync {
  constructor() {

  }

  /**
   * @author Erwin Macaraig
   *
   * @argument
   * records array which resolve to object that must contain parent_id
   * @description
   * returns the original record with together with the infomation regarding the root parent (building)
   */
  public async getRootParent(records: Array<object>) {
    let tempParentId = 0;
    for (let i = 0; i < records.length; i++) {
      let loc = new Location(records[i]['parent_id']);
      await loc.load();
      tempParentId = +loc.get('parent_id');
      while (tempParentId !== -1) {
        loc = null;
        loc = new Location(tempParentId);
        await loc.load();
        tempParentId = +loc.get('parent_id');
      }
      records[i]['root_parent_name'] = (loc.get('name').toString().length > 0) ? loc.get('name').toString() :
        loc.get('formatted_address');
      records[i]['main_address'] = loc.get('formatted_address').toString();
      records[i]['root_parent_loc_id'] = loc.ID();
      records[i]['google_photo_url'] = loc.get('google_photo_url');
    }
    return records;
  }
}
