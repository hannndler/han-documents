const fs = require('fs');
const path = require('path');
const dist = require(path.join(__dirname, '..', 'dist', 'han-excel.cjs'));
const ExcelReader = dist.ExcelReader;
const OutputFormat = dist.OutputFormat;

function getLatestFile() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('mergeAs-realrows-') && f.endsWith('.xlsx'))
    .map(f => ({
      name: f,
      full: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs
    }))
    .sort((a, b) => a.mtime - b.mtime);
  return files.length ? files[files.length - 1].full : null;
}

(async()=>{
  const file = getLatestFile();
  if (!file) {
    console.error('No mergeAs-realrows-*.xlsx found in examples directory.');
    process.exit(1);
  }

  const buffer = fs.readFileSync(file);
  const reader = new ExcelReader({ outputFormat: OutputFormat.WORKSHEET, includeEmptyRows: true });
  const result = await reader.fromBuffer(buffer, { outputFormat: OutputFormat.WORKSHEET, includeEmptyRows: true });
  if (!result.success) {
    console.error('Read failed:', result);
    process.exit(1);
  }

  const workbook = result.data.workbook;
  if (!workbook || !workbook.sheets || workbook.sheets.length === 0) {
    console.error('No sheets found.');
    process.exit(1);
  }

  const sheet = workbook.sheets[0];
  console.log('File:', file);
  console.log('Worksheet name:', sheet.name);
  console.log('Row count:', sheet.totalRows);
  console.log('Rows:');
  for (const row of sheet.rows) {
    const values = row.cells.map(c => c?.value ?? null);
    console.log(row.rowNumber, values);
  }
})();
