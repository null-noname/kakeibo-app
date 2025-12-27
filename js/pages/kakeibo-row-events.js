import { saveDB } from '../services/db.js';
import { parseNum } from './kakeibo-utils.js';

export function attachRowEvents(ins, it, redo) {
    ins[0].onblur = (e) => { it.date = e.target.value; saveDB({}); };
    ins[1].onblur = (e) => { it.name = e.target.value; saveDB({}); };
    const setV = (idx, k1, k2, k3) => {
        ins[idx].onfocus = (e) => e.target.value = it[k1] ?? (it[k2] || it[k3] || "");
        ins[idx].onblur = (e) => {
            it[k1] = parseNum(e.target.value);
            delete it[k2]; delete it[k3];
            saveDB({}); redo();
        };
    };
    setV(2, 'v1', 'plan', 'out'); setV(3, 'v2', 'act', 'in');
}
