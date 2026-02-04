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
      { key: 'itemName', value: 'Rubro' },
      { key: 'contractedAmount', value: 'Cantidad' },
      { key: 'totalKilos', value: 'Total Kilos' }
    ],
    body: [],
    footers: [],
    showBorders: false,
    showStripes: false,
  };

  // Simulando estructura real con muchos proveedores y items
  const suppliers = Array.from({ length: 20 }).map((_, i) => ({ name: `Supplier ${i + 1}` }));
  const items = Array.from({ length: 8 }).map((_, i) => ({ name: `Item ${i + 1}` }));

  suppliers.forEach((supplier, index) => {
    items.forEach((item, itemIndex) => {
      const children = [
        {
          header: 'contractedAmount',
          value: 0,
          key: 'contractedAmount',
          type: CellType.NUMBER,
        },
        {
          header: 'totalKilos',
          value: 0,
          key: 'totalKilos',
          type: CellType.NUMBER,
        }
      ];

      if (itemIndex === 0) {
        children.unshift(
          {
            header: 'supplier',
            value: supplier.name,
            key: 'supplier',
            type: CellType.STRING,
            mergeAs: { rows: items.length - 1 },
          }
        );
        children.unshift(
          {
            header: 'item',
            key: 'item',
            value: index + 1,
            type: CellType.NUMBER,
            mergeAs: { rows: items.length - 1 },
          }
        );
      }

      table.body.push({
        header: 'itemName',
        key: 'itemName',
        value: item.name,
        type: CellType.STRING,
        jump: true,
        children
      });
    });
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
