import { saveDB, state } from '../services/db.js';

export function attachRowActions(bts, bi, ii, m, redo) {
    bts[0].onclick = () => {
        const items = state.years[state.currentYear].months[m][bi].items;
        if (ii > 0) {
            [items[ii], items[ii - 1]] = [items[ii - 1], items[ii]];
            saveDB({}); redo();
        }
    };
    bts[1].onclick = () => {
        if (confirm("削除?")) {
            state.years[state.currentYear].months[m][bi].items.splice(ii, 1);
            saveDB({}); redo();
        }
    };
}
