import { state, saveDB } from '../services/db.js';
import { logout } from '../services/auth.js';

export function init() {
    const s = () => JSON.stringify(state);
    document.getElementById('btn-share').onclick = async () => {
        if (navigator.share) await navigator.share({ title: '家計簿', text: s() });
        else alert(s());
    };
    document.getElementById('btn-copy').onclick = () => {
        navigator.clipboard.writeText(s());
        alert("コピー完了");
    };
    document.getElementById('btn-import').onclick = () => {
        try {
            const v = document.getElementById('backup-box').value;
            if (v) { saveDB(JSON.parse(v)); location.reload(); }
        } catch (e) { alert("エラー"); }
    };
    document.getElementById('btn-logout').onclick = logout;
}
