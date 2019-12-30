#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {sprintf} = require('sprintf-js');
const glob = require('glob');
const user = process.argv[2];
const retweetCount = {};
const quotedCount = {};

let filename = glob.sync(`${__dirname}/data/${user}-tweets-*.json`).pop();
const tweets = JSON.parse(fs.readFileSync(filename));
let total = tweets.length;
for (const tweet of tweets) {
    if (tweet.retweeted_status) {
        const name = tweet.retweeted_status.user.screen_name;
        if (retweetCount[name]) {
            retweetCount[name]++;
        }
        else {
            retweetCount[name] = 1;
        }
    }
    else if (tweet.quoted_status) {
        const name = tweet.quoted_status.user.screen_name;
        if (quotedCount[name]) {
            quotedCount[name]++;
        }
        else {
            quotedCount[name] = 1;
        }
    }
}
printCounts('RETWEETS', retweetCount, 10, total);
printCounts('QUOTED TWEETS', quotedCount, 5, total);
printCounts('TOTAL TWEETS', {'': tweets.length}, 0, total);
console.log('');
filename = glob.sync(`${__dirname}/data/${user}-favorites-*.json`).pop();
const favorites = JSON.parse(fs.readFileSync(filename));
total = favorites.length;
const favoriteCount = {};
for (const tweet of favorites) {
    const name = tweet.user.screen_name;
    if (favoriteCount[name]) {
        favoriteCount[name]++;
    }
    else {
        favoriteCount[name] = 1;
    }
}
favoriteCount.TOTAL = total;
printCounts('FAVORITES', favoriteCount, 0, total);

function printCounts(title, counts, threshold, total) { // eslint-disable-line max-params
    const format = '%16s %5d %5.1f%%';
    console.log(title);
    const countSort = (a, b) => (counts[b] - counts[a]) || a.localeCompare(b);
    for (const name of Object.keys(counts).sort(countSort)) {
        const count = counts[name];
        if (count < threshold) {
            break;
        }
        console.log(sprintf(format, name, count, 100 * count / total));
    }
}
