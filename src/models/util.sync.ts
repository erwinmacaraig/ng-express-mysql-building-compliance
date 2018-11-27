import {Location} from './location.model';
import { Account } from './account.model';
import { ComplianceKpisModel } from './comliance.kpis.model';
import { NotificationToken } from './notification_token.model';
import { NotificationConfiguration } from './notification_config.model';
import { EmailSender } from './email.sender';
import * as moment from 'moment';
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

    if (compliance_item == 5 && locationData['is_building'] != 1) {
      // get immediate parent
      const bldgObjData = await new Location(locationData['parent_id']).load();
      location_dir = `${bldgObjData['location_directory_name']}/${locationData['location_directory_name']}`;
    } else if (locationData['is_building'] == 1) {
      location_dir = locationData['location_directory_name'];
    } else {
      // get immediate parent
      const building_dbData = await new Location(locationData['parent_id']).load();
      location_dir = `${building_dbData['location_directory_name']}/${locationData['location_directory_name']}`;
    }

    const kpis_dbData = await new ComplianceKpisModel(compliance_item).load();
    console.log(`${account_dbData['account_directory_name']}/${location_dir}/${kpis_dbData['directory_name']}/${document_type}/`);
    return `${account_dbData['account_directory_name']}/${location_dir}/${kpis_dbData['directory_name']}/${document_type}/`;    
  }


  public async sendToNotification(userId=0, type='', id=0, idType='', data={}, res?) {

    switch(type) {
      case 'resend-notification':
        const config = await new NotificationConfiguration(data['notification_config_id']).load();
        let strToken = data['strToken'];
        let notificationToken = new NotificationToken();
        await notificationToken.create({
          strToken: strToken,
          notification_token_id: data['notification_token_id'],
          user_id: data['user_id'],
          location_id: data['location_id'],
          role_text: data['role_text'],
          notification_config_id: data['notification_config_id'],
          dtExpiration: moment().add(2, 'day').format('YYYY-MM-DD'),
          dtLastSent: moment().format('YYYY-MM-DD')
        });
        notificationToken = null;
        let parentName = ''
        let 
          emailData = {
            message : config['message'].replace(/(?:\r\n|\r|\n)/g, '<br>'),
            users_fullname : data['first_name']+' '+data['last_name'],
            account_name : data['account_name'],
            location_name : data['parent'] ?  `${data['parent']} ${data['name']}` : `${data['name']}`,
            yes_link : 'http://' + data['host'] + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken),
            no_link : 'http://' + data['host'] + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken),
            role : data['role_text']
          }
          const opts = {
            from : '',
            fromName : 'EvacConnect',
            to : ['adelfin@evacgroup.com.au'],
            cc: ['emacaraig@evacgroup.com.au'],
            body : '',
            attachments: [],
            subject : 'EvacConnect Email Notification'
          };
          const email = new EmailSender(opts);
          email.sendFormattedEmail(data['emailType'], emailData, res, 
            (data) => console.log(data),
            (err) => console.log(err)
          );

      break;
    }

  }

}
