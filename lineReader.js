'use strict';

const { Transform } = require('stream');
const fs = require('fs');

class LineReader extends Transform {
  constructor(options = {}) {
    super(options);
    this.extra = '';
  }
  _transform(chunk, enc, cb) {
    try {
      chunk = this.extra + chunk.toString();
      const split = chunk.split(/\r?\n/);
      this.extra = split.pop();
      for(const line of split) {
        if(!!line) {
          this.push(line);
        }
      }
      cb();
    } catch(err) {
      cb(err);
    }
  }
  _flush(cb) {
    if(!!this.extra) {
      this.push(this.extra);
    }
    cb();
  }
  toArray() {
    const array = [];
    this.on('data', data => array.push(data));
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(array));
      this.once('error', reject);
    });
  }
}

module.exports = function lineStream (path, options = {}) {
  const lrOptions = options.awaitStrings ? { objectMode: true } : {};
  const lineReader = new LineReader(lrOptions);
  return fs.createReadStream(path, options).pipe(lineReader);
};
