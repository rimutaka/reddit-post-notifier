import { browser } from 'webextension-polyfill-ts';
import type { RedditPostData, RedditPostResponse } from './reddit-api/reddit-types';

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const mapObjToQueryStr = (params: Record<string, unknown>) =>
    Object.entries(params)
        .map((pair) => pair.join('='))
        .join('&');

export const wait = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

export const $: ParentNode['querySelector'] = document.querySelector.bind(document);

export const subredditNameRegExp = /^[A-Za-z0-9]\w{1,20}$/;

export const redditUrl = 'https://reddit.com';
export const redditOldUrl = 'https://old.reddit.com';

export const generateId = () => (Date.now() + crypto.getRandomValues(new Uint32Array(1))[0]).toString(36);

export const getSubredditUrl = (subreddit: string, oldReddit = false): string =>
    `${oldReddit ? redditOldUrl : redditUrl}/r/${subreddit}/new`;

export const getSearchQueryUrl = (query: string, subreddit = '', oldReddit = false): string => {
    const endpoint = subreddit
        ? `/r/${subreddit}/search?sort=new&restrict_sr=on&q=${query}`
        : `/search?q=${query}&sort=new`;

    return `${oldReddit ? redditOldUrl : redditUrl}${endpoint}`;
};

export const debounce = (func: (...args: unknown[]) => unknown, waitMs: number) => {
    let waiting = false;
    let tmId;
    return (...args: unknown[]) => {
        if (waiting) clearTimeout(tmId);
        waiting = true;
        tmId = setTimeout(() => {
            func(...args);
            waiting = false;
        }, waitMs);
    };
};

export const getMsg = (msg: string) => browser.i18n.getMessage(msg);

/** Filter out not needed properties */
export const filterPostDataProperties = (post: RedditPostResponse) => {
    if (!post?.data) return post;
    const filterList: Array<keyof RedditPostData> = [
        'author',
        'created_utc',
        'created',
        'id',
        'name',
        'over_18',
        'permalink',
        'preview',
        'selftext',
        'subreddit',
        'title',
        'url',
    ];

    const data = filterList.reduce((acc, property) => {
        if (post.data[property]) {
            acc[property] = post.data[property];
        }
        return acc;
    }, {}) as RedditPostData;

    if (data.selftext?.length > 400) {
        data.selftext = data.selftext.slice(0, 400);
    }

    return { ...post, data };
};