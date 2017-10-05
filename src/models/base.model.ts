
export abstract class BaseClass {

    protected id: number = 0;
    protected dbData: {}; 
    protected fields: Array<string> = [];

    constructor(id?: number) {
        if(id) {
            this.id = id;
        }
    }

    protected abstract load();

    public setID(id: number) {
        this.id = id;
    }

    public ID(): number {
        return this.id;
    }

    public getDBData(): {} {
        return this.dbData;
    }

    public get(fieldname: string) {
        if(fieldname in this.dbData) {
            return this.dbData[fieldname];
        }
    }

    









}