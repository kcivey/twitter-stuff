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
                const m = moment(dateString);
                assert(m.isValid(), 'Invalid date');
                return m;
            },
        },
    })
    .strict(true)
    .argv;
const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    bearer_token: process.env.TWITTER_BEARER_TOKEN,
});

main()
    .catch(function (err) {
        console.trace(err);
        process.exit(1);
    });

async function main() {
    await getTweets('tweets');
    await getTweets('favorites');
}

async function getTweets(type) {
    const allTweets = [];
    let url;
    let maxId = null;
    const params = {
        screen_name: argv.user,
        count: 200,
        include_rts: 1,
    };
    if (type === 'tweets') {
        params.include_rts = 1;
        url = 'statuses/user_timeline';
    }
    else {
        params.include_entities = 0;
        url = 'favorites/list';
    }
    console.warn(type);
    while (true) {
        console.warn(maxId);
        if (maxId) {
            params.max_id = maxId;
        }
        const newTweets = await client.get(url, params);
        let newCount = 0;
        for (const tweet of newTweets) {
            const tweetDate = moment(tweet.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY');
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
    const filename = `${__dirname}/data/${argv.user}-${type}-${argv.date.format('YYYYMMDD')}.json`;
    fs.writeFileSync(filename, JSON.stringify(allTweets, null, 2));
}

function pause(interval) {
    return new Promise(function (resolve) {
        setTimeout(resolve, interval);
    });
}
