const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const distFolder = process.argv[2];

if (!distFolder) {
  throw new Error('Path should be present.');
}

const outputDir = path.resolve(__dirname, distFolder);
const filesList = fs.readdirSync(outputDir).filter(file => path.extname(file) === '.js');
getNext(filesList, outputDir, () => console.log('Done!'));

function compressFile(filename, outputDir, callback) {
  let compress = zlib.createGzip();
  let input = fs.createReadStream(path.join(outputDir, filename));
  let output = fs.createWriteStream(path.join(outputDir, filename) + '.gz');

  input.pipe(compress).pipe(output);

  if (callback) {
    output.on('finish', callback);
    output.on('error', (error) => console.error(error));
  }
}

function getNext(filesList, outputDir, callback) {
  if (filesList.length) {
    const file = filesList.shift();
    compressFile(file, outputDir, () => {
      console.log(`File ${file} has been compiled.`);
      getNext(filesList, outputDir, callback);
    });
  } else if (callback) {
    callback();
  }
}