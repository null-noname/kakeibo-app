export function getRowHtml(it, idx) {
    const val = it.cost ?? (it.price || 0);
    return `<td><input class="date-input" value="${it.date || ''}"></td>
        <td><textarea class="kakeibo-text">${it.text || ''}</textarea></td>
        <td><input class="money-input" value="${Number(val).toLocaleString()}" type="tel"></td>
        <td><button class="mini-btn">▲</button></td>
        <td><button class="mini-btn btn-del">×</button></td>`;
}

export function getTableHead() {
    return `<thead><tr><th class="col-date">日付</th><th>内容</th><th class="col-money">金額</th><th class="col-btn"></th><th class="col-btn"></th></tr></thead>`;
}
