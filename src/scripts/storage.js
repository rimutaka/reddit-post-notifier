import { filterPostDataProperties } from './utils';

const authKeys = ['accessToken', 'expiresIn', 'refreshToken'];

export const dataFields = {
    queries: {},
    queriesList: [],
    subredditList: [],
    subreddits: {},
    messages: {},
    pinnedPostList: [],
    notifications: [],
};

const storage = {
    /**
     * Move list of subreddits outside options object.
     * This is necessary to update to V3 and save data.
     */
    async migrateToV3() {
        let subredditList = await storage.getSubredditList();
        if (subredditList && subredditList.length) return;

        const options = await storage.getOptions();
        subredditList = options?.watchSubreddits;
        if (subredditList?.length) {
            options.watchSubreddits = undefined;
            return browser.storage.local.set({ options, subredditList });
        }
    },

    async getAuthData(keys = authKeys) {
        return browser.storage.local.get(keys);
    },

    async getMessageData() {
        const { messages } = await browser.storage.local.get({ messages: {} });
        return messages;
    },

    async getOptions() {
        const { options } = await browser.storage.local.get('options');
        return options;
    },

    async getPinnedPostList() {
        const { pinnedPostList } = await browser.storage.local.get({
            pinnedPostList: [],
        });
        return pinnedPostList;
    },

    async getSubredditList() {
        const { subredditList } = await browser.storage.local.get({ subredditList: [] });
        return subredditList;
    },

    async getSubredditData() {
        const { subreddits } = await browser.storage.local.get({ subreddits: {} });
        return subreddits;
    },

    async getQueriesList() {
        const { queriesList } = await browser.storage.local.get({ queriesList: [] });
        return queriesList;
    },

    async getQueriesData() {
        const { queries } = await browser.storage.local.get({ queries: {} });
        return queries;
    },

    async getNotificationsData() {
        const { notifications } = await browser.storage.local.get({ notifications: [] });
        return notifications;
    },

    async getAllData(withOptions = false) {
        const fields = { ...dataFields };
        if (withOptions) fields.options = {};
        return browser.storage.local.get(fields);
    },

    /**
     * @param {Object} data
     */
    async saveAuthData(data) {
        const {
            access_token: accessToken,
            expires_in: expiresInRelative,
            refresh_token: refreshToken,
            // token_type: tokenType,
            // scope,
        } = data;

        const expiresIn = expiresInRelative && new Date().getTime() + expiresInRelative * 1000;

        return browser.storage.local.set({
            ...(accessToken && { accessToken }),
            ...(refreshToken && { refreshToken }),
            ...(expiresIn && { expiresIn }),
        });
    },

    async saveMessageData({ newMessages, count }) {
        const data = (await storage.getMessageData()) || {};
        data.messages = data.messages || [];
        if (count === 0) {
            data.messages = [];
        } else if (newMessages) data.messages.unshift(...newMessages);

        if (newMessages && newMessages[0]) data.lastPostCreated = newMessages[0].data.created;

        data.count = count;

        data.lastUpdate = Date.now();

        await browser.storage.local.set({ messages: data });
    },

    /**
     * @param {Object} data
     */
    async saveOptions(data) {
        const optionsPrev = await this.getOptions();
        return browser.storage.local.set({ options: { ...optionsPrev, ...data } });
    },

    async savePinnedPost(post) {
        const prev = await storage.getPinnedPostList();
        if (prev.findIndex((p) => p.data.id === post.data.id) === -1) {
            return browser.storage.local.set({
                pinnedPostList: [post, ...prev],
            });
        }
    },

    async saveSubredditList(subredditList) {
        storage.prune({ subredditList });
        return browser.storage.local.set({ subredditList });
    },

    async saveQuery(query) {
        const queriesList = await storage.getQueriesList();
        const updateStatus = {
            wasUpdated: false,
            shouldClear: false,
        };
        const queriesUpdated = queriesList.map((q) => {
            const { id, subreddit: prevSubreddit, query: prevQuery } = q;
            if (id !== query.id) return q;

            if (prevQuery !== query.query || prevSubreddit !== query.subreddit) {
                updateStatus.shouldClear = true;
            }
            updateStatus.wasUpdated = true;
            return query;
        });
        if (!updateStatus.wasUpdated) queriesUpdated.push(query);
        if (updateStatus.shouldClear) {
            await storage.removeQueryData(query.id);
        }
        return browser.storage.local.set({ queriesList: queriesUpdated });
    },

    // Update given subreddit or reddit search data object with new posts or error
    updateWatchDataObject(watchData, posts, error = null) {
        const result = { ...watchData };
        if (posts && posts.length) {
            const savedPosts = result.posts || [];
            const ids = new Set(savedPosts.map((p) => p.data.id));
            const postFiltered = posts.map((p) => filterPostDataProperties(p)).filter((p) => !ids.has(p.data.id));
            result.posts = [...postFiltered, ...savedPosts];
            if (postFiltered[0]) {
                result.lastPost = postFiltered[0].data.name;
                result.lastPostCreated = postFiltered[0].data.created;
            }
        }

        result.error = error;
        result.lastUpdate = Date.now();
        return result;
    },

    async saveQueryData(queryId, { posts = [], error = null }) {
        const data = await storage.getQueriesData();
        const current = data[queryId] || {};
        const updatedQuery = storage.updateWatchDataObject(current, posts, error);
        await browser.storage.local.set({ queries: { ...data, [queryId]: updatedQuery } });
    },

    async saveSubredditData(subreddit, { posts = [], error = null }) {
        const data = await storage.getSubredditData();
        const current = data[subreddit] || {};
        const updatedSubreddit = storage.updateWatchDataObject(current, posts, error);
        return browser.storage.local.set({ subreddits: { ...data, [subreddit]: updatedSubreddit } });
    },

    async saveNotificationsData(id, data) {
        const prev = await storage.getNotificationsData();
        const notifications = prev.slice(-9); // limit length of the array in the storage
        notifications.push({ id, data });
        return browser.storage.local.set({ notifications });
    },

    async clearAuthData() {
        const authData = {};
        authKeys.forEach((key) => {
            authData[key] = null;
        });
        await browser.storage.local.set(authData);
    },

    async clearStorage() {
        await browser.storage.local.clear();
    },

    async removeMessages() {
        const { messages } = await browser.storage.local.get({ messages: {} });
        await browser.storage.local.set({ messages: { ...messages, messages: [], count: 0 } });
    },

    async removeQueryData(queryId) {
        const queries = { ...(await storage.getQueriesData()) };
        queries[queryId] = { posts: [] };
        await browser.storage.local.set({ queries });
    },

    async removePost({ id, subreddit, searchId }) {
        if (subreddit) {
            const subreddits = await storage.getSubredditData();

            subreddits[subreddit].posts = subreddits[subreddit].posts.filter(({ data }) => data.id !== id);

            await browser.storage.local.set({ subreddits });
        }

        if (searchId) {
            const queries = await storage.getQueriesData();
            queries[searchId].posts = queries[searchId].posts.filter(({ data }) => data.id !== id);

            await browser.storage.local.set({ queries });
        }
    },

    async removePinPost(id) {
        const pinnedPostList = await storage.getPinnedPostList();
        return browser.storage.local.set({
            pinnedPostList: pinnedPostList.filter((p) => p.data.id !== id),
        });
    },

    async removePostsFrom({ subreddit, searchId }) {
        if (subreddit) {
            const subreddits = await storage.getSubredditData();
            subreddits[subreddit].posts = [];
            await browser.storage.local.set({ subreddits });
        }
        if (searchId) {
            const queries = await storage.getQueriesData();
            queries[searchId].posts = [];
            await browser.storage.local.set({ queries });
        }
    },

    async removeAllPosts() {
        const [subreddits = {}, queries = {}] = await Promise.all([
            storage.getSubredditData(),
            storage.getQueriesData(),
        ]);

        Object.keys(subreddits).forEach((subr) => {
            subreddits[subr].posts = [];
        });
        Object.keys(queries).forEach((q) => {
            queries[q].posts = [];
        });

        await browser.storage.local.set({ subreddits, queries });
    },

    async removeQueries(ids = []) {
        const queriesList = await storage.getQueriesList();
        const queriesUpdated = queriesList.filter((q) => !ids.includes(q.id));
        storage.prune({ queriesIdList: queriesUpdated.map((q) => q.id) });
        return browser.storage.local.set({ queriesList: queriesUpdated });
    },

    async removeNotificationData(id) {
        const prev = await storage.getNotificationsData();
        const notifications = prev.filter((n) => n.id !== id);
        return browser.storage.local.set({ notifications });
    },

    /**
     * Remove unused data
     */
    async prune({ subredditList, queriesIdList }) {
        if (subredditList) {
            const subreddits = await storage.getSubredditData();
            if (subreddits) {
                const pruned = Object.keys(subreddits).reduce((acc, sub) => {
                    if (subredditList.includes(sub)) {
                        acc[sub] = subreddits[sub];
                    }
                    return acc;
                }, {});
                await browser.storage.local.set({ subreddits: pruned });
            }
        }

        if (queriesIdList) {
            const queries = await storage.getQueriesData();
            if (queries) {
                const prunedQueries = Object.keys(queries).reduce((acc, qId) => {
                    if (queriesIdList.includes(qId)) {
                        acc[qId] = queries[qId];
                    }
                    return acc;
                }, {});
                await browser.storage.local.set({ queries: prunedQueries });
            }
        }
    },

    async countNumberOfUnreadItems(updateBadge = true) {
        let count = 0;
        const { subredditList, queriesList, queries, subreddits, messages } = await browser.storage.local.get();

        if (subredditList?.length && subreddits) {
            count += subredditList.reduce((acc, curr) => {
                if (subreddits[curr] && subreddits[curr].posts) return acc + subreddits[curr].posts.length;
                return acc;
            }, 0);
        }

        if (queriesList && queriesList.length && queries) {
            count += queriesList.reduce((acc, curr) => {
                if (queries[curr.id] && queries[curr.id].posts) return acc + queries[curr.id].posts.length;
                return acc;
            }, 0);
        }

        if (messages && messages.count) count += messages.count;

        if (updateBadge) browser.browserAction.setBadgeText({ text: count ? String(count) : '' });
        return count;
    },
};

export default storage;
