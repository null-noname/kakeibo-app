import { loginWithGoogle } from '../services/auth.js';

export function init() {
    const btn = document.getElementById('login-google-btn');
    if (btn) {
        btn.onclick = () => loginWithGoogle();
    }
}
