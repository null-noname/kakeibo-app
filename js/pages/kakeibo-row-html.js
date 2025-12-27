export function getRowHtml(it) {
    const v1 = it.v1 ?? (it.plan || it.out || 0);
    const v2 = it.v2 ?? (it.act || it.in || 0);
    return `<td><input class="day-input" value="${it.date || ''}" type="tel"></td>
        <td><textarea class="kakeibo-text">${it.name || ''}</textarea></td>
        <td><input class="money-input" value="${Number(v1).toLocaleString()}" type="tel"></td>
        <td><input class="money-input" value="${Number(v2).toLocaleString()}" type="tel"></td>
        <td><button class="mini-btn">▲</button></td><td><button class="mini-btn btn-del">×</button></td>`;
}
