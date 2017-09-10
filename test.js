'use strict';

const fs = require('fs');
const JFE = require('./jsonFieldExtractor');
const JsonStreamStringify = require('json-stream-stringify');
const base64 = require('base64-stream');

const avatarFile = fs.createReadStream('./avatar.jpg', {encoding: 'base64', highWaterMark: 16000});

const json = JsonStreamStringify({
  name: 'David',
  lastName: 'Desmarais-Michaud',
  avatar: avatarFile,
  age: 26,
  gender: 'm',
  occupation: 'software developer'
});

const jfe = new JFE({field: 'avatar'});
const b64Decoder = base64.decode();
const writeStream = fs.createWriteStream('./image.jpg');

let chunkCount = 0;
const logger = new require('stream').Writable({
  write(chunk, enc, cb) {
    console.log(`chunk #${++chunkCount}: `, chunk.toString());
    cb();
  }
});

json
  .on('end', () => console.log('Json stream end'))
  .on('close', () => console.log('Json stream closed'));

jfe
  .on('end', () =>  console.log('jfe end'))
  .on('finish', () => console.log('jfe finish'));

b64Decoder
  .on('finish', () => console.log('b64 finish'))
  .on('end', () => console.log('b64 end'));

writeStream
  .on('end', () => console.log('writestream end'))
  .on('finish', () => console.log('writestream finished'));

json
  .pipe(jfe)
  .pipe(b64Decoder)
  .pipe(writeStream);

json.pipe(logger);