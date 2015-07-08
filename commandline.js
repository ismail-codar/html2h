#!/usr/bin/env node

var fs = require('fs');
var convert = require('./');

var fileName = process.argv[2];

if (!fileName) {
    throw new Error('HTML file must be first argument');
}

var output = convert(fs.readFileSync(fileName, "utf8").toString());

if(process.argv.length == 3) {
    console.log(output);
} else {
    fs.writeFileSync(process.argv[3], output, "utf8");
    console.log("<<" + process.argv[3] + ">>");
}