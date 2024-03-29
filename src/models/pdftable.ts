import * as PDFDocument from 'pdfkit';

export class PDFDocumentWithTables extends PDFDocument {

    constructor (options?) {
        if(options){
            super(options);
        }else{
            super();
        }
    }

    public table (table, arg0, arg1, arg2) {
        let 
        thisClass = <any> this,
        startX = thisClass['page'].margins.left, 
        startY = thisClass.y,
        options = <any> {};

        if ((typeof arg0 === 'number') && (typeof arg1 === 'number')) {
            startX = arg0;
            startY = arg1;

            if (typeof arg2 === 'object')
                options = arg2;
        } else if (typeof arg0 === 'object') {
            options = arg0;
        }

        const columnCount = table.headers.length;
        const columnSpacing = options.columnSpacing || 15;
        const rowSpacing = options.rowSpacing || 5;
        const usableWidth = options.width || (this['page'].width - this['page'].margins.left - this['page'].margins.right);

        const prepareHeader = options.prepareHeader || (() => {});
        const prepareRow = options.prepareRow || (() => {});
        const computeRowHeight = (row) => {
            let result = 0;

            row.forEach((cell) => {
                const cellHeight = thisClass.heightOfString(cell, {
                    width: columnWidth,
                    align: 'left'
                });
                result = Math.max(result, cellHeight);
            });

            return result + rowSpacing;
        };

        const columnContainerWidth = usableWidth / columnCount;
        const columnWidth = columnContainerWidth - columnSpacing;
        const maxY = this['page'].height - this['page'].margins.bottom;

        let rowBottomY = 0;

        thisClass.on('pageAdded', () => {
            startY = this['page'].margins.top;
            rowBottomY = 0;
        });

        // Check to have enough room for header and first rows
        if (startY + 10 * computeRowHeight(table.headers) > maxY)
            thisClass.addPage();

        // Titles
        thisClass.fontSize('14').text(table.title).moveDown(0.5);
        startY += 21;

        // Refresh the y coordinate of the top of the headers row
        rowBottomY = Math.max(startY, rowBottomY);

        thisClass
            .moveTo(startX, rowBottomY - rowSpacing * 0.5)
            .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
            .lineWidth(0.5);

        startY += 3;

        // Allow the user to override style for headers
        prepareHeader();

        // Print all headers
        table.headers.forEach((header, i) => {
            thisClass.text(header, startX + i * columnContainerWidth, startY, {
                width: columnWidth,
                align: 'left'
            });
        });

        // Refresh the y coordinate of the bottom of the headers row
        rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);

        // Separation line between headers and rows
        thisClass.moveTo(startX, rowBottomY - rowSpacing * 0.5)
            .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
            .lineWidth(0.5);

        table.rows.forEach((row, i) => {
            // Allow the user to override style for rows
            prepareRow(row, i);

            const rowHeight = computeRowHeight(row);

            // Switch to next page if we cannot go any further because the space is over.
            // For safety, consider 3 rows margin instead of just one
            if (startY + 3 * rowHeight < maxY)
                startY = rowBottomY + rowSpacing;
            else
                thisClass.addPage();

            // Print all cells of the current row
            row.forEach((cell, i) => {
                thisClass.text(cell, startX + i * columnContainerWidth, startY, {
                    width: columnWidth,
                    align: 'left'
                });
            });

            // Refresh the y coordinate of the bottom of this row
            rowBottomY = Math.max(startY + rowHeight, rowBottomY);

            // Separation line between rows
            thisClass.moveTo(startX, rowBottomY - rowSpacing * 0.5)
                .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
                .lineWidth(1)
                .opacity(0.7)
                .stroke()
                .opacity(1); // Reset opacity after drawing the line
        });

        thisClass.x = startX;
        thisClass.moveDown();
        thisClass.moveDown();
        thisClass.moveDown();

        return thisClass;
    }
}