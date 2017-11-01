
export class InvitationCode {

    constructor(
        public invitation_code_id: number = 0,
        public code: string = '',
        public first_name: string = '',
        public last_name: string = '',
        public email: string = '',
        public location_id: string = '',
        public account_id: string = '',
        public role_id: number = 3,
        public was_used: number = 0,
        public role_text?: string
    ) {

    }

}
