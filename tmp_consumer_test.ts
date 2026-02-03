import { ExcelBuilder } from './packages/han-excel-builder/src/core/ExcelBuilder';

async function run() {
	const builder = new ExcelBuilder({
		metadata: { title: 'Test', author: 'CI' }
	});

	const sheet = builder.addWorksheet('Sheet1');
	sheet.addHeader({ key: 'a', value: 'Name', type: (global as any).String });
	sheet.addRow({ a: 'Alice' });
	sheet.addRow({ a: 'Bob' });

	const outPath = './tmp-output/test.xlsx';
	const res = await builder.saveToFile(outPath, { createDir: true });
	console.log('saveToFile result:', res);
}

run().catch((e) => { console.error(e); process.exit(1); });

