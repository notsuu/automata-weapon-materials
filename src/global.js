const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const error = $("#error");

window.save = {
    weapons: [],
    items: [],
    summary: {},
    summaryLevel: 4
};
save.items.get = function(id) {
    if (typeof id === "string") id = +id;
    return this.find(i => i.id === id) ?? {
        id: id ?? -1,
        name: ITEMS[id] ?? "???",
        count: 0
    };
};

function setError(title, text) {
    error.innerHTML = `<b>${title}</b><br>${text}`;
    error.classList.toggle("hide", title == null || text == null);
}

function showError(e) {
    console.error(e);
    const details = `<pre>${e.toString()}\n\n${e.stack}</pre>`;
    setError("Oh no!", `Something went really wrong. Please report this issue.<br>${details}`);
}