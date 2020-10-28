import getElements from './elements';
import nav from './navigation';

/**
 * @param {KeyboardEvent} e
 */
export default async function handleKeydownEvent(e) {
    const { target, key, code } = e;

    // Prevent scrolling by arrow key and other potential default behavior
    if ([' ', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Backspace'].includes(key)) e.preventDefault();

    // Mark selected post or subreddit as read
    if (code === 'Space') {
        if (target.tagName !== 'LI' || !target.dataset.id) return;
        const ul = target.parentElement;
        if (ul.classList.contains('query-list') || ul.classList.contains('post-list')) {
            const btn = target.querySelector('button.check-mark');
            if (btn) btn.click();
        }
        return;
    }

    // Navigate to the list of posts or open selected post
    if ((key === 'ArrowRight' || key === 'Enter' || code === 'KeyL') && target.tagName === 'LI' && target.dataset.id) {
        if (target.parentElement.classList.contains('query-list')) {
            const btn = target.querySelector('button.arrow-right');
            if (btn) btn.click();
        }
        if (target.parentElement.classList.contains('post-list')) {
            const link = target.querySelector('a');
            link.click();
            if (TARGET === 'firefox') {
                // close window shortly after the click because the extension will lose focus in firefox anyway
                setTimeout(() => window.close(), 50);
            }
        }
        return;
    }

    // Open subreddit or search
    if (key === 'Enter' && target === document.body) {
        const { headerSubredditLink } = getElements();
        headerSubredditLink.click();
        setTimeout(() => window.close(), 50);
        return;
    }

    // Select next element in the list
    if (key === 'ArrowDown' || code === 'KeyJ') {
        const { mainContainer } = getElements();
        if (target.tagName === 'LI') {
            const next = target.nextElementSibling ? target.nextSibling : target.parentElement.firstElementChild;
            next.focus();
        } else {
            const ul = mainContainer.querySelector('ul');
            if (ul) ul.firstElementChild.focus();
        }
        return;
    }
    // Select previous element in the list
    if (key === 'ArrowUp' || code === 'KeyK') {
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
    if (key === 'ArrowLeft' || key === 'Backspace' || code === 'KeyH') {
        await nav.navigate(nav.locations.queriesList, { forceUpdate: true });
    }
}
