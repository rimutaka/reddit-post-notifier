import getTemplates from './templates';
import getElements from './elements';
import getOptions from './options';
import nav from './navigation';
import { connect } from './messages';

async function handleKeydownEvent({ target, key }) {
    // Mark selected post or subreddit as read
    if (key === ' ') {
        if (target.tagName !== 'LI' || !target.dataset.id) return;
        const ul = target.parentElement;
        if (ul.classList.contains('query-list') || ul.classList.contains('post-list')) {
            const btn = target.querySelector('button.check-mark');
            if (btn) btn.click();
        }
        return;
    }

    // Navigate to the list of posts or open selected post
    if ((key === 'ArrowRight' || key === 'Enter') && target.tagName === 'LI' && target.dataset.id) {
        if (target.parentElement.classList.contains('query-list')) {
            const btn = target.querySelector('button.arrow-right');
            if (btn) btn.click();
        }
        if (target.parentElement.classList.contains('post-list')) {
            const link = target.querySelector('a');
            link.click();
        }
        return;
    }

    // Open subreddit or search
    if (key === 'Enter') {
        const { headerSubredditLink } = getElements();
        headerSubredditLink.click();
        return;
    }

    // Select next element in the list
    if (key === 'ArrowDown') {
        const { mainContainer } = getElements();
        if (target.tagName === 'LI') {
            const next = target.nextElementSibling
                ? target.nextSibling
                : target.parentElement.firstElementChild;
            next.focus();
        } else {
            const ul = mainContainer.querySelector('ul');
            if (ul) ul.firstElementChild.focus();
        }
        return;
    }
    // Select previous element in the list
    if (key === 'ArrowUp') {
        const { mainContainer } = getElements();
        if (target.tagName === 'LI') {
            const next = target.previousElementSibling
                ? target.previousElementSibling
                : target.parentElement.lastElementChild;
            next.focus();
        } else {
            const ul = mainContainer.querySelector('ul');
            if (ul) ul.lastElementChild.focus();
        }
        return;
    }

    // Go to main screen
    if (key === 'ArrowLeft' || key === 'Backspace') {
        await nav.navigate(nav.locations.queriesList, { forceUpdate: true });
    }
}

async function init() {
    getTemplates();
    getOptions();
    const elements = getElements();
    connect(nav);

    elements.headerBackBtn.addEventListener('click', () => nav.navigate(nav.locations.queriesList, { forceUpdate: true }));
    elements.options.addEventListener('click', async () => {
        await browser.runtime.openOptionsPage();
        window.close();
    });
    document.addEventListener('keydown', handleKeydownEvent);
}

async function start() {
    await init();
    await nav.navigate(nav.locations.queriesList);
}

document.addEventListener('DOMContentLoaded', start, {
    capture: true,
    passive: true,
    once: true,
});
