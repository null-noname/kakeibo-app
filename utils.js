/**
 * 共通ユーティリティ (utils.js)
 */

/**
 * 数値をカンマ区切りの文字列に変換
 * @param {number|string} n 
 * @returns {string}
 */
export function formatNum(n) {
    return Number(n).toLocaleString();
}

/**
 * スマート日付短縮入力 (V8.11)
 * 4桁: MMDD -> M/D
 * 3桁: MDD -> M/D (10-12月優先)
 * @param {string} v 
 * @returns {string}
 */
export function formatDateAnnual(v) {
    const nums = v.replace(/[^0-9]/g, '');
    if (nums.length === 4) return parseInt(nums.slice(0, 2)) + "/" + parseInt(nums.slice(2, 4));
    if (nums.length === 3) {
        let m12 = parseInt(nums.slice(0, 2));
        if (m12 >= 10 && m12 <= 12) {
            return m12 + "/" + parseInt(nums.slice(2, 3));
        } else {
            return parseInt(nums.slice(0, 1)) + "/" + parseInt(nums.slice(1, 3));
        }
    }
    return v;
}

// グローバル登録 (移行期間中の互換性維持のため)
window.formatNum = formatNum;
window.formatDateAnnual = formatDateAnnual;
