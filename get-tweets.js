#!/usr/bin/env node

require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const Twitter = require('twitter');
const moment = require('moment');
const argv = require('yargs')
    .options({
        user: {
            type: 'string',
            describe: 'screen name of user to get tweets for',
            required: true,
            requiredArg: true,
        },
        date: {
            type: 'string',
            describe: 'oldest date to get tweets for',
            default: '1970-01-01',
            requiredArg: true,
            coerce(dateString) {
                const m = moment(dateString, 'ddd MMM DD HH:mm:ss ZZ YYYY');
                assert(m.isValid(), 'Invalid date');
                return m;
            },
        },
    })
    .strict(true)
    .argv;

main()
    .catch(function (err) {
        console.trace(err);
        process.exit(1);
    });

async function main() {
    const client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        bearer_token: process.env.TWITTER_BEARER_TOKEN,
    });
    const allTweets = [];
    let maxId = null;
    const params = {
        screen_name: argv.user,
        count: 200,
        include_rts: 1,
    };
    while (true) {
        console.warn(maxId);
        if (maxId) {
            params.max_id = maxId;
        }
        const newTweets = await client.get('statuses/user_timeline', params);
        let newCount = 0;
        for (const tweet of newTweets) {
            const tweetDate = moment(tweet.created_at);
            if (tweetDate < argv.date) {
                break;
            }
            newCount++;
            allTweets.push(tweet);
        }
        if (!newCount || newCount < newTweets.length) {
            break;
        }
        maxId = (BigInt(newTweets[newTweets.length - 1].id_str) - BigInt(1)).toString();
        await pause(1000);
    }
    const filename = __dirname + '/data/' + argv.user + '-tweets-' + argv.date.format('YYYYMMDD') + '.json';
    fs.writeFileSync(filename, JSON.stringify(allTweets, null, 2));
}

function pause(interval) {
    return new Promise(function (resolve) {
        setTimeout(resolve, interval);
    });
}
