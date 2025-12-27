/**
 * ナビゲーション（年選択・月シークバー）の描画と制御
 */
export function renderNav(data, yd, m, onUpdate) {
    const sel = document.getElementById('year-select');
    const tabs = document.getElementById('month-tabs');
    const btnAdd = document.getElementById('btn-year-add');
    const btnDel = document.getElementById('btn-year-del');

    // 1. 年選択の更新
    sel.innerHTML = Object.keys(data.years).sort().map(y =>
        `<option value="${y}" ${y == data.currentYear ? 'selected' : ''}>${y}年</option>`
    ).join('');
    sel.onchange = (e) => {
        data.currentYear = e.target.value;
        onUpdate();
    };

    // 2. 年の追加・削除ボタン（色を復活させるためのクラスを付与）
    btnAdd.className = 'btn-year-ctrl bg-green';
    btnAdd.onclick = () => {
        const n = prompt("西暦を入力");
        if (n && !data.years[n]) {
            data.years[n] = { months: {} };
            data.currentYear = n;
            onUpdate();
        }
    };

    btnDel.className = 'btn-year-ctrl bg-red';
    btnDel.onclick = () => {
        if (Object.keys(data.years).length > 1 && confirm("削除しますか?")) {
            delete data.years[data.currentYear];
            data.currentYear = Object.keys(data.years)[0];
            onUpdate();
        }
    };

    // 3. 月シークバー（横スクロール可能にする構造）
    tabs.innerHTML = [...Array(12)].map((_, i) =>
        `<div class="month-btn ${m == i + 1 ? 'active' : ''}">${i + 1}月</div>`
    ).join('');

    [...tabs.children].forEach((b, i) => {
        b.onclick = () => {
            yd.activeMonth = i + 1;
            onUpdate();
        };
    });
}
