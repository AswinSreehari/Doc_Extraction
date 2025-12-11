'use strict';
const CloudConvert = require('cloudconvert');

const apiKey = process.env.CLOUDCONVERT_API_KEY || '';
const masked = apiKey ? `${apiKey.slice(0,4)}...${apiKey.slice(-4)}` : '(not set)';
console.log(`[cloudconvertClient] CLOUDCONVERT_API_KEY: ${masked}`);

const cloudConvert = new CloudConvert({ apiKey });
module.exports = cloudConvert;
