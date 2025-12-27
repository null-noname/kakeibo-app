export function getCardHtml(m, i) {
    return `
        <div class="memo-card-header">
            <span class="memo-card-title">${m.title || "無題"}</span>
            <div class="memo-ctrl-btns">
                <button class="mini-btn" id="m-up-${i}">▲</button>
                <button class="mini-btn btn-edit" id="m-ed-${i}">編集</button>
            </div>
        </div>
        <div class="memo-card-body ${m.isOpen ? '' : 'collapsed'}" id="m-body-${i}">${m.body || ""}</div>`;
}
