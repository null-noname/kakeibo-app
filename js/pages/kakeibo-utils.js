export const formatNum = (n) => Number(n).toLocaleString();
export const parseNum = (v) => {
    let n = parseInt(v.replace(/[^0-9\-]/g, '')) || 0;
    return Math.min(Math.max(n, -999999), 999999);
};

export function fixDate(v) {
    const n = v.replace(/[^0-9]/g, '');
    if (n.length === 4) return parseInt(n.slice(0, 2)) + "/" + parseInt(n.slice(2, 4));
    if (n.length === 3) {
        if (n[0] === '0') return parseInt(n.slice(1, 2)) + "/" + parseInt(n.slice(2, 3));
        let m = parseInt(n.slice(0, 2));
        return (m >= 10 && m <= 12) ? m + "/" + parseInt(n.slice(2, 3)) : parseInt(n.slice(0, 1)) + "/" + parseInt(n.slice(1, 3));
    }
    return v.slice(0, 2);
}

export function autoHeight(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}
