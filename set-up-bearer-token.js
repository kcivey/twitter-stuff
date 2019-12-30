#!/usr/bin/env node

require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const request = require('request-promise-native');
const envFile = __dirname + '/.env';

main()
    .catch(function (err) {
        console.trace(err);
        process.exit(1);
    });

async function main() {
    const result = await request({
        uri: 'https://api.twitter.com/oauth2/token',
        auth: {
            user: process.env.TWITTER_CONSUMER_KEY,
            password: process.env.TWITTER_CONSUMER_SECRET,
        },
        form: {
            grant_type: 'client_credentials',
        },
        json: true,
        method: 'POST',
    });
    const bearerToken = result.access_token;
    assert(bearerToken, "Didn't get bearer token");
    const content = fs.readFileSync(envFile, 'utf8');
    fs.writeFileSync(envFile, content.replace(/(?<=TWITTER_BEARER_TOKEN=).*/, bearerToken));
    console.warn('Bearer token written');
}
