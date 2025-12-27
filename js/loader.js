export async function loadPage(name, targetId = 'app') {
    const target = document.getElementById(targetId);
    const res = await fetch(`./components/${name}.html`);
    target.innerHTML = await res.text();

    document.querySelectorAll(`.${targetId}-style`).forEach(e => e.remove());

    // CSSの読み込み設定
    const files = [];
    if (name === 'kakeibo') {
        // 収支画面の場合は分割された新しいCSSを読み込む
        files.push('kakeibo-layout.css', 'kakeibo-ui.css');
    } else {
        files.push(`${name}.css`);
    }

    files.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.className = `${targetId}-style`;
        link.href = `./css/pages/${file}`;
        document.head.appendChild(link);
    });

    const mod = await import(`./pages/${name}.js`);
    if (mod.init) mod.init();
}
