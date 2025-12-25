import { onAuthStateChanged } from './services/auth.js';
import { loadPage } from './loader.js';
import { initDB } from './services/db.js';

onAuthStateChanged((user) => {
    if (user) {
        initDB('kakeiboData', (data) => {
            loadPage('header', 'header');
            // ステートがロードされたらメイン画面へ
            loadPage('kakeibo');
        });
    } else {
        document.getElementById('header').innerHTML = '';
        loadPage('login');
    }
});
