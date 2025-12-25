import { loadPage } from '../loader.js';

export function init() {
    const tabs = ['memo', 'fixed', 'kakeibo', 'save'];
    tabs.forEach(name => {
        const el = document.getElementById(`tab-${name}`);
        if (el) {
            el.onclick = () => {
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                loadPage(name);
            };
        }
    });
}

export function setActive(name) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    const el = document.getElementById(`tab-${name}`);
    if (el) el.classList.add('active');
}
