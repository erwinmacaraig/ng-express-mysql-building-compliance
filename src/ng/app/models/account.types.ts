export class AccountTypes {

  getTypes() {
    return {
      '0' : { 'role_id' : 1, 'value' : 'FRP', 'description' : 'Building Manager' },
      '1' : { 'role_id' : 2, 'value' : 'TRP', 'description' : 'Tenant' },
      '2' : { 'role_id' : 3, 'value' : 'ECO', 'description' : 'ECO' }
    };
  }

  getTypeName() {
    return [
      '',
      'Building Manager',
      'Tenant',
      'ECO'
    ];
    /*
    return [
      {'role_id' : 1, 'value' : 'FRP', 'description' : 'Building Manager' },
      { 'role_id' : 2, 'value' : 'TRP', 'description' : 'Tenant' },
      { 'role_id' : 3, 'value' : 'ECO', 'description' : 'ECO' }
    ];
    */
  }



}
