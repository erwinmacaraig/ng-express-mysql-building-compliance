export class PrintService{
    
    content = '';
    links = <any> [];
    styles = <any> [];

    constructor( opts? ) {
        if(opts){
            for(let i in opts){
                if(i in this){
                    this[i] = opts[i];
                }
            }
        }

        this.copyParentStyle();
    }

    private copyParentStyle(){
        this.links = document.querySelectorAll('link[rel="stylesheet"]');
        this.styles = document.querySelectorAll('style');
    }

    private appendParentStyle(doc){
        let head = doc.querySelectorAll('head');
        head = head[0];
        for(let link of this.links){
            head.appendChild(link.cloneNode(true));
        }

        for(let style of this.styles){
            head.appendChild(style.cloneNode(true));
        }
    }

    print(){

        this['popupWin'] = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
        this['popupWin'].document.open();
        this['popupWin'].document.write(
        `
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <title>Print page</title>
                    <style>
                        @media print{
                            .no-print, .no-print *{
                                display: none !important;
                            }

                            .print-no-margin{
                                margin : 0px !important;
                            }

                            .container{
                                width : 100% !important;
                            }

                            a{
                                color: #333 !important;
                            }
                        }
                    </style>
                </head>
                <body onload="window.print(); window.close()">
                    ${this.content}
                </body>
            </html>
        `
        );

        this.appendParentStyle(this['popupWin'].document);

        this['popupWin'].document.close();
    }

}