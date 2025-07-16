const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Paths
const svgPath = path.join(__dirname, 'public', 'favicon.svg');
const pngPath = path.join(__dirname, 'public', 'favicon.png');
const icoPath = path.join(__dirname, 'public', 'favicon.ico');

// First convert SVG to PNG (as an intermediate step)
sharp(svgPath)
  .resize(256, 256) // Resize to a good base size
  .png()
  .toFile(pngPath)
  .then(() => {
    // Then convert PNG to ICO (which is just a renamed PNG for modern browsers)
    fs.copyFile(pngPath, icoPath, (err) => {
      if (err) {
        console.error('Error creating ICO file:', err);
        return;
      }
      console.log('Successfully created favicon.ico!');
      
      // Clean up the temporary PNG file
      fs.unlink(pngPath, (err) => {
        if (err) {
          console.error('Error removing temporary PNG file:', err);
        }
      });
    });
  })
  .catch(err => {
    console.error('Error processing image:', err);
  });