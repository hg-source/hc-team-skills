'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Preserve the previous bytes before replacing a file. Never delete backups.
function writePreserving(destination, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  let backup = null;
  if (fs.existsSync(destination)) {
    if (fs.lstatSync(destination).isSymbolicLink() || !fs.statSync(destination).isFile()) {
      throw new Error(`Refusing to overwrite a link or non-file: ${destination}`);
    }
    if (fs.readFileSync(destination).equals(bytes)) return { changed: false, backup };
    const stamp = new Date().toISOString().replace(/[^0-9]/g, '');
    backup = `${destination}_backup_${stamp}_${crypto.randomUUID()}`;
    fs.copyFileSync(destination, backup, fs.constants.COPYFILE_EXCL);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  return { changed: true, backup };
}

function clean(text) { return text.replace(/[\u0000\uFEFF\u200B\u3000]/g, ''); }

function localPdfName(name, directory) {
  if (typeof name !== 'string' || !name || /[\\/:\x00]/.test(name) || !/\.pdf$/i.test(name)) {
    throw new Error(`PDF must be a local filename, not a path or URL: ${name}`);
  }
  const filename = path.join(directory, name);
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile() || fs.lstatSync(filename).isSymbolicLink()) {
    throw new Error(`PDF missing or not a regular local file: ${name}`);
  }
  return name;
}

module.exports = { writePreserving, clean, localPdfName };
