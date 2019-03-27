
export interface AccountSubscriptionInterface {
    account_id: number;
    subscriptionType: string;
    bulk_license_total: number;
    valid_till: any;
    feature: Array<string>;
}