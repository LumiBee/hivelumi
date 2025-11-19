import * as critical from 'critical';
import path from 'path';

const generateCriticalCSS = async () => {
  try {
    console.log('Generating critical CSS...');
    await critical.generate({
      inline: true,
      base: 'dist/',
      src: 'index.html',
      target: {
        html: 'index.html'
      },
      width: 1200,
      height: 800,
      // Add any other options you need from the critical library
    });
    console.log('Critical CSS generated successfully!');
  } catch (error) {
    console.error('Error generating critical CSS:', error);
    process.exit(1);
  }
};

generateCriticalCSS();
