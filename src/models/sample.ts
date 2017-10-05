import { BaseClass } from './base.model';

export class Sample extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load(): void {

        return;
    }

    public dbUpdate(): void {
        return;
    }

    public dbInsert(): void {
        return;
    }

    public create(createData: {}): void {
        return;
    }

}