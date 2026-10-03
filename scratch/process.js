const Jimp = require('jimp');

async function processImg() {
  console.log('Reading image...');
  const image = await Jimp.read('../public/images/logo.png');
  console.log('Processing pixels...');
  // Loop through each pixel
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // If pixel is white or close to white (e.g. > 230)
    // Make it transparent
    if (r > 230 && g > 230 && b > 230) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
  console.log('Writing image...');
  await image.writeAsync('../public/images/logo-transparent.png');
  console.log('Done!');
}

processImg().catch(console.error);
