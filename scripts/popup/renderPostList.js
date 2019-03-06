import getTemplates from './templates';
import types from '../types';
import { postMessage } from './messages';

const baseUrl = 'https://reddit.com';

function renderPostListRow(postListRowTmp, post) {
    const postListRow = postListRowTmp.querySelector('li');
    const rowLink = postListRow.querySelector('a');
    rowLink.textContent = post.title;
    rowLink.href = `${baseUrl}${post.permalink}`;
    postListRow.dataset.id = post.id;
    return postListRow;
}

function renderPostListBlock({ posts, subreddit }) {
    const templates = getTemplates();
    const postListTmp = templates.postList.cloneNode(true);
    const postList = postListTmp.querySelector('ul');

    if (posts && posts.length) {
        const postFragment = posts.reduce((fragment, post) => {
            fragment.appendChild(renderPostListRow(
                templates.postListRow.cloneNode(true),
                post.data,
            ));
            return fragment;
        }, document.createDocumentFragment());

        postList.appendChild(postFragment);
    }
    postList.classList.add('run-animation');

    postList.addEventListener('click', ({ target }) => {
        if (target.classList.contains('check-mark')) {
            const li = target.parentNode;
            const { id } = li.dataset;
            postMessage({ type: types.READ_POST, payload: { id, subreddit } });
            li.classList.add('read');
        }
    });

    return postList;
}

export default renderPostListBlock;