/**
 * Example script to generate a PDF using PDFBuilder
 */

import { PDFBuilder } from '../src/core/PDFBuilder';
import * as fs from 'fs/promises';
import * as path from 'path';

async function generatePDF() {
  console.log('🚀 Starting PDF generation...\n');

  try {
    // Create a new PDFBuilder instance
    const builder = new PDFBuilder({
      metadata: {
        title: 'Sample PDF Document',
        author: 'Han PDF Builder',
        subject: 'Example PDF generation',
        keywords: ['pdf', 'example', 'han-documents'],
        description: 'This is a sample PDF generated using Han PDF Builder'
      }
    });

    // Add first page
    const page1 = builder.addPage('Page1');
    page1.addText('Welcome to Han PDF Builder!');
    page1.addText('This is the first page of the document.');
    
    // Add some more text with different content
    page1.addText([
      'Features:',
      '✅ Multiple pages support',
      '✅ Text and image support',
      '✅ Customizable styles and themes',
      '✅ Metadata support',
      '✅ TypeScript support'
    ]);

    // Add second page
    const page2 = builder.addPage('Page2');
    page2.addText('Second Page', {
      font: {
        family: 'Helvetica',
        size: 20,
        style: 'bold'
      }
    });
    page2.addText('This is content from the second page.');
    page2.addText('You can add as many pages as you need!');

    // Add third page
    const page3 = builder.addPage('Page3');
    page3.addText('Third Page', {
      font: {
        family: 'Helvetica',
        size: 18,
        style: 'bold'
      }
    });
    page3.addText([
      'This is a multi-line text example.',
      'Each line will be rendered separately.',
      'Perfect for lists and formatted content.'
    ]);

    console.log('📄 Building PDF...');
    
    // Build the PDF
    const result = await builder.build();

    if (!result.success) {
      console.error('❌ Error building PDF:', result.error.message);
      if (result.error.code) {
        console.error('   Code:', result.error.code);
      }
      process.exit(1);
    }

    console.log('✅ PDF built successfully!');
    
    // Get statistics
    const stats = builder.getStats();
    console.log('\n📊 Statistics:');
    console.log(`   Total pages: ${stats.totalPages}`);
    console.log(`   File size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Build time: ${stats.buildTime}ms`);

    // Save to file
    const outputDir = path.resolve(process.cwd(), 'dist/examples');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'sample.pdf');
    console.log(`\n💾 Saving PDF to: ${outputPath}`);
    const saveResult = await builder.saveToFile(outputPath);

    if (!saveResult.success) {
      console.error('❌ Error saving PDF:', saveResult.error.message);
      process.exit(1);
    }

    console.log(`\n💾 PDF saved to: ${outputPath}`);
    console.log(`   Full path: ${path.resolve(outputPath)}`);
    console.log(`   File size: ${(stats.fileSize / 1024).toFixed(2)} KB\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
generatePDF()
  .then(() => {
    console.log('✨ PDF generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

