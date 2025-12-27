import { saveDB } from '../services/db.js';
import { parseNum, fixDate, autoHeight } from './kakeibo-utils.js';

export function attachEvents(tr, it, list, idx, redo) {
    const ins = tr.querySelectorAll('input, textarea');
    ins[0].onblur = (e) => { it.date = fixDate(e.target.value); saveDB({}); redo(); };
    ins[1].oninput = (e) => autoHeight(e.target);
    ins[1].onblur = (e) => { it.text = e.target.value; saveDB({}); };
    ins[2].onfocus = (e) => e.target.value = it.cost ?? (it.price || "");
    ins[2].onblur = (e) => {
        it.cost = parseNum(e.target.value); delete it.price;
        saveDB({}); redo();
    };
    const bts = tr.querySelectorAll('button');
    bts[0].onclick = () => { if (idx > 0) { [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]]; saveDB({}); redo(); } };
    bts[1].onclick = () => { if (confirm("削除?")) { list.splice(idx, 1); saveDB({}); redo(); } };
    setTimeout(() => autoHeight(ins[1]), 0);
}
