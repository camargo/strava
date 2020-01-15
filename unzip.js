const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Unzip all '.gz' files and delete each '.gz' file after it's unzipped.
 */
function main() {
  const filesPath = process.argv[2];

  fs.readdir(filesPath, (_, files) => {
    for (let i = 0; i < files.length; ++i) {
      const fileName = files[i];
      const filePath = `${filesPath}/${files[i]}`;

      if (fileName.includes('.gz')) {
        execSync(`gunzip ${filePath}`);
      }
    }
  });
}

main();
