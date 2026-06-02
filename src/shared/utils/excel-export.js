import * as XLSX from 'xlsx';

function ensureXlsxExtension(filename) {
    const base = String(filename || 'export').trim() || 'export';
    return base.toLowerCase().endsWith('.xlsx') ? base : `${base}.xlsx`;
}

/**
 * Descarga un libro de trabajo Excel en el navegador.
 * @param {import('xlsx').WorkBook} workbook
 * @param {string} filename
 */
export function downloadExcelWorkbook(workbook, filename) {
    XLSX.writeFile(workbook, ensureXlsxExtension(filename));
}

/**
 * @param {Array<{ name: string, rows: Array<Record<string, unknown>> | Array<Array<unknown>> }>} sheets
 * @param {string} filename
 */
export function exportMultiSheetExcel({ sheets, filename }) {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const name = (sheet.name || 'Hoja').slice(0, 31);
        const worksheet = Array.isArray(sheet.rows?.[0])
            ? XLSX.utils.aoa_to_sheet(sheet.rows)
            : XLSX.utils.json_to_sheet(sheet.rows ?? []);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }

    downloadExcelWorkbook(workbook, filename);
}

/**
 * Exporta filas tabulares con columnas definidas.
 * @param {{ filename: string, sheetName?: string, columns: Array<{ header: string, field: string, exportValue?: (row: object) => unknown }>, rows: object[] }} options
 */
export function exportTableToExcel({ filename, sheetName = 'Datos', columns, rows }) {
    const header = columns.map((c) => c.header);
    const data = rows.map((row) =>
        columns.map((col) => {
            if (col.exportValue) return col.exportValue(row);
            const val = row[col.field];
            return val == null ? '' : val;
        }),
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    downloadExcelWorkbook(workbook, filename);
}
