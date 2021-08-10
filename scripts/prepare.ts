// code mostly from https://github.com/antfu/vitesse-webext
// generate stub index.html files for dev entry
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { getManifest } from '../src/manifest';
import { r, port, isDev, log } from './utils';

/**
 * Stub index.html to use Vite in development
 */
async function stubIndexHtml() {
    const views = ['options', 'popup'];

    for (const view of views) {
        await fs.ensureDir(r(`extension/dist/${view}`));
        let data = await fs.readFile(r(`src/views/${view}/index.html`), 'utf-8');
        data = data.replace('"./main.ts"', `"http://localhost:${port}/${view}/main.ts"`);
        await fs.writeFile(r(`extension/dist/${view}/index.html`), data, 'utf-8');
        log('PRE', `stub ${view}`);
    }
}

export async function writeManifest() {
    await fs.writeJSON(r('extension/manifest.json'), await getManifest(), { spaces: 2 });
    log('PRE', 'write manifest.json');
}

void writeManifest();

if (isDev) {
    void stubIndexHtml();
    chokidar.watch(r('views/**/*.html')).on('change', () => {
        void stubIndexHtml();
    });
    chokidar.watch([r('src/manifest.ts'), r('package.json')]).on('change', () => {
        void writeManifest();
    });
}