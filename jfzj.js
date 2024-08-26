import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';
import ignore from 'ignore';

async function searchFiles(searchString, dir = process.cwd()) {
  let ig;
  try {
    const gitignoreContent = await fs.readFile(path.join(dir, '.gitignore'), 'utf8');
    ig = ignore().add(gitignoreContent+ '\n.git' + '\nnode_modules'+ '\npackage-lock.json');
  } catch (error) {
    // If .gitignore doesn't exist or can't be read, create an empty ignore object
    ig = ignore();
  }

  async function searchRecursively(currentDir) {
    const files = await fs.readdir(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const relativePath = path.relative(dir, filePath);

      // Skip if the file is ignored by .gitignore
      if (ig.ignores(relativePath)) {
        continue;
      }

      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await searchRecursively(filePath);
      } else if (stat.isFile()) {
        await searchInFile(filePath, searchString);
      }
    }
  }

  async function searchInFile(filePath, searchString) {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;
      const index = line.indexOf(searchString);
      if (index !== -1) {
        const relativePath = path.relative(dir, filePath);
        console.log(`${relativePath}:${lineNumber}:${index + 1} | ${line.trim()}`);
      }
    }
  }

  await searchRecursively(dir);
}

// Main execution
const searchString = process.argv[2];

if (!searchString) {
  console.error('Please provide a search string.');
  process.exit(1);
}

searchFiles(searchString).catch(error => {
  console.error('An error occurred:', error);
});