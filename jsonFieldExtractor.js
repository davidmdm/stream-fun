'use strict';

const {Transform} = require('stream');

const recursiveOptional = (charArray) => {
  if(charArray.length > 1) {
    return [charArray[0], '(', ...recursiveOptional(charArray.slice(1)), ')', '?'];
  }
  return charArray;
};

module.exports = class JsonFieldExtractor extends Transform {
  constructor(options = {}) {
    if (!options.field) {
      throw new Error('Field is required');
    }
    super(options);
    const chars = ['"', ...options.field.split(''), '"', '\\s*:\\s*', '"'];
    this.regex = new RegExp(`"${options.field}"\\s*:\\s*"`);
    this.optionalRegex = new RegExp(recursiveOptional(chars).join('') + '$');
    this.done = false;
    this.match = false;
    this.partMatch = '';
  }
  _transform(chunk, enc, cb) {
    chunk = this.partMatch ? this.partMatch + chunk : chunk.toString();
    if (!this.done) {
      if (this.match) {
        this._pushData(chunk);
        return cb();
      }
      const hardMatch = chunk.match(this.regex);
      if (hardMatch) {
        this.match = true;
        this.partMatch = '';
        this._pushData(chunk.split(hardMatch)[1]);
        return cb();
      }
      const partMatch = chunk.match(this.optionalRegex);
      if (partMatch) {
        this.partMatch = chunk.slice(partMatch.index);
      } else {
        this.partMatch = '';
      }
    }
    return cb();
  }
  _pushData(chunk) {
    const end = chunk.match(/"/);
    if (end) {
      this.push(chunk.split(/"/)[0]);
      this.done = true;
    } else {
      this.push(chunk);
    }
  }
};
