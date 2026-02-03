const lib = require('./packages/han-excel-builder/dist/han-excel.cjs');

(async () => {
  try {
    const { ExcelBuilder, CellType } = lib;

    const builder = new ExcelBuilder({ metadata: { title: 'Test', author: 'CI' } });
    const sheet = builder.addWorksheet('Sheet1');

    // Add header and two rows using IDataCell format
    sheet.addHeader({ key: 'col1', value: 'Name', type: CellType.STRING });
    sheet.addRow([{ key: 'r1c1', header: 'col1', type: CellType.STRING, value: 'Alice' }]);
    sheet.addRow([{ key: 'r2c1', header: 'col1', type: CellType.STRING, value: 'Bob' }]);

    const outPath = './tmp-output/test.xlsx';
    const res = await builder.saveToFile(outPath, { createDir: true });
    console.log('saveToFile result:', res);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
