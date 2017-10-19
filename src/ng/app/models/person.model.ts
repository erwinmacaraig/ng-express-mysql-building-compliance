
export class Person {
  constructor(
    public first_name: string,
    public last_name: string,
    public email: string,
    public phone_number?: string,
    public user_name?: string,
    public account_type: number = 3
  ) {  }
}
