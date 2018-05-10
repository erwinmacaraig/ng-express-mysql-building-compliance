import { Injectable } from '@angular/core';
declare var $: any;
import * as moment from 'moment';
@Injectable()
export class ExportToCSV {

    dataArray = [];
    csv = '';
    filename = moment().format('YYYY-MM-DD-HH-mm-ss');

    constructor() {}

    setData(data, fname?){
        this.dataArray = (data) ? data : [];
        this.filename = (!fname) ? this.filename : fname;
        this.csv = '';
        this.turnToCSV();
    }
    
    turnToCSV(){

        for(let i in this.dataArray){
            for(let n in this.dataArray[i]){
                this.dataArray[i][n] = this.dataArray[i][n].toString().replace(/,/g, ' ');
            }
        }

        for(let i in this.dataArray){
            this.csv += this.dataArray[i].join(',')+'\n';
        }

    }

    export(){

        var blob = new Blob([this.csv], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, this.filename+'.csv');
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", this.filename+'.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
}
