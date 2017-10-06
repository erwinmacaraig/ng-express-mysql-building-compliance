
export abstract class BaseClass {

    protected id: number = 0;
    protected dbData = {};
    protected fields: Array<string> = [];

    constructor(id?: number) {
        if(id) {
            this.id = id;
        }
    }


    //protected abstract load(callback:()=>any): void;
    //protected abstract load(): void;

    protected abstract dbUpdate(): void;

    protected abstract dbInsert(): void;

    protected abstract create(createData: {}): void;

    public setID(id: number): void {
        this.id = id;
    }

    public ID(): number {
        return this.id;
    }

    public getDBData(): {} {
        return this.dbData;
    }

    public get(fieldName: string): number|string {
        if(fieldName in this.dbData) {
            return this.dbData[fieldName];
        }
    }

    public set(fieldName: string, fieldValue: number|string): void {
        this.dbData[fieldName] = fieldValue;
    }

    public write() {
        if(this.ID()) {
            this.dbUpdate();
        }
        else {
            this.dbInsert();
        }
    }

}
