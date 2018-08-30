import {Location} from './location.model';
import { Account } from './account.model';
import { ComplianceKpisModel } from './comliance.kpis.model';

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
      let loc;
      if (records[i]['parent_id'] !== -1) {
        loc = new Location(records[i]['parent_id']);
        await loc.load();
        tempParentId = +loc.get('parent_id');
        while (tempParentId !== -1) {
          loc = null;
          loc = new Location(tempParentId);
          await loc.load();
          tempParentId = +loc.get('parent_id');
        }
      } else {
        loc = new Location(records[i]['location_id']);
        await loc.load();
      }

      if (loc.get('name') && loc.get('name').toString().length > 0) {
        records[i]['root_parent_name'] = loc.get('name').toString();
      } else if (loc.get('formatted_address')) {
        records[i]['root_parent_name'] = loc.get('formatted_address')
      }
      records[i]['main_address'] = loc.get('formatted_address');
      records[i]['root_parent_loc_id'] = loc.ID();
      records[i]['google_photo_url'] = loc.get('google_photo_url');
    }
    return records;
  }

  public async getAccountUploadDir(
    account_id: number = 0,
    building_id: number = 0,
    compliance_item: number = 0,
    document_type: string = 'Primary',
    downloadAsPack: boolean = false
  ): Promise<string> {
    let location_dir = '';
    const account_dbData =  await new Account(account_id).load();

    const locationData = await new Location(building_id).load();
    if (locationData['is_building'] == 1) {
      location_dir = locationData['location_directory_name'];
    } else {
      // get immediate parent
      const building_dbData = await new Location(locationData['parent_id']).load();
      location_dir = `${building_dbData['location_directory_name']}/${locationData['location_directory_name']}`;
    }
    if (downloadAsPack) {
      
      return `${account_dbData['account_directory_name']}/${location_dir}`;
      
    } else {
      const kpis_dbData = await new ComplianceKpisModel(compliance_item).load();
      console.log(`${account_dbData['account_directory_name']}/${location_dir}/${kpis_dbData['directory_name']}/${document_type}/`);
      return `${account_dbData['account_directory_name']}/${location_dir}/${kpis_dbData['directory_name']}/${document_type}/`;
    }
    
  }

}
