// __mocks__/fs.js

const fs = jest.createMockFromModule('fs');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}

// A custom version of `readFileSync` that reads from the mock file system.
function readFileSync(filePath) {
  return mockFiles[filePath] || '';
}

// A custom version of `existsSync` that checks the mock file system.
function existsSync(filePath) {
  return mockFiles[filePath] !== undefined;
}

fs.readFileSync = readFileSync;
fs.existsSync = existsSync;
fs.__setMockFiles = __setMockFiles;

module.exports = fs;