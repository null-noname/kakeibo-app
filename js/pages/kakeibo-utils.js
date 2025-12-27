/**
 * 収支画面用の共通ユーティリティ関数
 */

// 数字を3桁区切りの文字列に変換 (例: 1000 -> "1,000")
export const formatNum = (n) => Number(n).toLocaleString();

// 入力文字列から数字のみを抽出し、範囲制限をかける (-999,999 〜 999,999)
export const parseNum = (v) => {
    let n = parseInt(String(v).replace(/[^0-9\-]/g, '')) || 0;
    return Math.min(Math.max(n, -999999), 999999);
};

// テキストエリアの高さに入力内容に合わせて自動調整する
export const autoHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
};
