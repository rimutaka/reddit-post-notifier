import getElements from './elements';
import renderQueryListBlock from './renderQueryList';
import renderPostListBlock from './renderPostList';
import updateHeader from './updateHeader';
import updateFooter from './updateFooter';
import { updateData, getData } from './data';

const nav = {
    locations: {
        queriesList: 'queriesList',
        postList: 'postList',
    },

    async navigate(location, params = {}) {
        const elements = getElements();
        if (params.forceUpdate) await updateData();
        const data = await getData();
        switch (location) {
            case this.locations.queriesList: {
                updateHeader(location);
                updateFooter(location);
                elements.mainContainer.innerHTML = '';
                elements.mainContainer.appendChild(
                    await renderQueryListBlock(nav),
                );
                break;
            }
            case this.locations.postList: {
                const { id, type } = params;
                const info = {};
                if (type === 'r') {
                    // eslint-disable-next-line prefer-destructuring
                    info.posts = data.subrData[id].posts;
                    info.subreddit = id;
                    updateHeader(location, {
                        name: `r/${id}/new`,
                        href: `https://reddit.com/r/${id}/new`,
                    });
                    updateFooter(location, {
                        subreddit: id,
                    });
                }
                elements.mainContainer.innerHTML = '';
                elements.mainContainer.appendChild(
                    renderPostListBlock(info),
                );

                break;
            }
            default:
        }
    },
};

export default nav;