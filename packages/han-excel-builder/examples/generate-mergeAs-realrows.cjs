const path = require('path');
const dist = require(path.join(__dirname, '..', 'dist', 'han-excel.cjs'));
const ExcelBuilder = dist.ExcelBuilder;
const CellType = dist.CellType;

(async function run(){
  const builder = new ExcelBuilder({ name: 'MergeAsRealRows' });

  const table = {
    name: 'RealRowsDemo',
    headers: [],
    subHeaders: [
      { key: 'item', value: 'Item' },
      { key: 'supplier', value: 'Supplier' },
      { key: 'note1', value: 'Note 1' },
      { key: 'note2', value: 'Note 2' }
    ],
    body: [],
    footers: [],
    showBorders: false,
    showStripes: false,
  };

  // Simulando tu estructura: item (destino) antes de supplier (source)
  const index = 1;
  const supplier = { name: 'Supplier Co' };
  const supplierStyle = undefined;
  const childRow = [
    { key: 'note1', header: 'note1', value: 'Line 1', type: CellType.STRING, jump: true },
    { key: 'note2', header: 'note2', value: 'Line 2', type: CellType.STRING }
  ];

  table.body.push({
    header: 'item',
    key: 'item',
    value: index,
    type: CellType.NUMBER,
    validation: { type: 'list', values: ['1', '2', '3'] },
    mergeAs: { fromKey: 'supplier' },
  });

  table.body.push({
    header: 'supplier',
    value: supplier.name,
    key: 'supplier',
    type: CellType.STRING,
    mergeCell: false,
    children: childRow,
    styles: supplierStyle,
    jump: false,
  });

  const ws = builder.addWorksheet('Sheet1');
  ws.addTable(table);

  const outPath = path.resolve(__dirname, `mergeAs-realrows-${Date.now()}.xlsx`);
  const res = await builder.saveToFile(outPath);
  if (res.success === false) {
    console.error('Failed to save:', res);
    process.exit(1);
  }
  console.log('Wrote example to', outPath);
})().catch(err=>{console.error(err);process.exit(1)});
