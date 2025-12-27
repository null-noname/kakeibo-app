import { saveDB, state } from '../services/db.js';

export function attachBlockEvents(div, b, redo) {
    const input = div.querySelector('input');
    input.onchange = (e) => {
        b.title = e.target.value;
        saveDB({ years: state.years });
    };
    const btn = div.querySelector('.btn-toggle');
    btn.onclick = () => {
        b.isOpen = !b.isOpen;
        saveDB({ years: state.years });
        redo();
    };
}
