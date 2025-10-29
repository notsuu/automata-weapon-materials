const sumMaterials = $("#sum_materials");
const sumLevels = [$("#sum_lv2"), $("#sum_lv3"), $("#sum_lv4")];
const tabs = $$(".tab");
const tabButtons = $$("#tabs button");

function canShowWeapon(weapon) {
    return weapon.level > 0 && weapon.level < 4 && WEAPONS[weapon.id] != null;
}

function getWeaponHTML(weapon, upgrade) {
    let next = upgrade ? ` &rightarrow; ${weapon.level + 1}` : "";
    return `
    <div class="info">
      <b>
        <span class="drop">${canShowWeapon(weapon) ? "▼ " : ""}</span>
        ${weapon.name}
      </b>
      <span>${weapon.level > 0 ? `lv ${weapon.level}${next}` : `not obtained`}</span>
    </div>
    <div class="materials hide"></div>
    `;
}

function getMaterialsHTML(weapon) {
    if (weapon.level < 1 || weapon.level > 3) return {html: "", upgrade: false};
    let html = "";
    let materials = WEAPONS[weapon.id][`lv${weapon.level + 1}`];
    let canUpgrade = 1;
    for (const material of materials) {
        let name = ITEMS[material[0]];
        let need = material[1];
        let owned = save.items.get(material[0]).count;
        let low = owned < need ? " low" : "";
        canUpgrade &= owned >= need;
        html += `<div class="material${low}"><b>${name}</b><span>${owned}/${need}</span></div>`;
    }
    return {html, upgrade: Boolean(canUpgrade)};
}

function displayWeaponList() {
    const parent = $("#weapons");
    for (const weapon of save.weapons) {
        let matData = getMaterialsHTML(weapon, save.items);

        let div = document.createElement("div");
        div.classList.add("weapon", `lv${weapon.level}`);
        div.innerHTML = getWeaponHTML(weapon, matData.upgrade);
        let materials = div.querySelector(".materials");
        materials.innerHTML = matData.html;

        div.addEventListener("click", e => {
            if (!canShowWeapon(weapon)) return;
            if (!e.target.closest(".materials")) {
                let closed = materials.classList.toggle("hide");
                div.querySelector(".drop").innerHTML = closed ? "▼ " : "▲ ";
            }
        });

        parent.append(div);
    }
}

function summaryGet() {
    let needs = {};
    let upgrading = save.weapons.filter(w => w.level < save.summaryLevel);
    if (upgrading.length <= 0) return null;
    for (const weapon of upgrading) {
        let wLevel = Math.max(2, weapon.level);
        for (let level = wLevel; level <= save.summaryLevel; level++) {
            const materials = WEAPONS[weapon.id][`lv${level}`];
            for (const [id, count] of materials)
                needs[id] = (needs[id] ?? 0) + count;
        }
    }
    return needs;
}

function summaryExport(download = false) {
    let output;
    if (save.summary == null) {
        output = `All your weapons are already at level ${save.summaryLevel}!`;
    } else {
        let complete = isSummaryComplete();
        let hideSufficient = sumMaterials.classList.contains("hide_sufficient");

        output = complete
            ? `You have all the required materials for level ${save.summaryLevel}!`
            : `Upgrading all weapons to level ${save.summaryLevel} requires:`;
        output += "\n";
        for (const id in save.summary) {
            let name = ITEMS[id];
            let owned = save.items.get(id).count;
            let need = save.summary[id];
            if (owned >= need && hideSufficient) continue;
            output += `[${owned.toString().padStart(3)}/${need.toString().padEnd(3)}] ${name}\n`;
        }

        let unowned = save.weapons.filter(w => w.level === 0);
        if (unowned.length > 0) {
            output += "Undiscovered weapons:\n";
            for (const weapon of unowned)
                output += `- ${weapon.name}\n`;
        }

        // remove last newline. doesn't make much of a difference but Whatever
        output = output.slice(0, output.length - 1);
    }

    if (download) {
        const blob = new Blob([output], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `materials_${new Date().toISOString().replaceAll(":", "-")}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else navigator.clipboard.writeText(output);
}

function isSummaryComplete() {
    for (const id in save.summary) {
        let owned = save.items.get(id).count;
        if (owned < save.summary[id]) return false;
    }
    return true;
}

function summaryDisplay() {
    let level = save.summaryLevel;
    sumLevels.forEach(btn => btn.classList.remove("active"));
    sumLevels[level - 2]?.classList.add("active");

    let summary = save.summary = summaryGet(level);
    if (summary == null)
        return sumMaterials.innerHTML = `All your weapons are already at level ${level}!`;
    let complete = isSummaryComplete();

    let status = complete
        ? "You have all the required materials!"
        : `Upgrading all weapons to level ${level} requires:`;
    let html = `${status} <ul>`;
    for (const id in summary) {
        let name = ITEMS[id];
        let owned = save.items.get(id).count;
        let need = summary[id];
        let low = owned < need ? " low" : "";
        html += `<li><div class="material${low}"><b>${name}</b><span>${owned}/${need}</span></div></li>`;
    }
    html += `</ul>`;

    let unowned = save.weapons.filter(w => w.level === 0);
    let uStatus = complete
        ? "...but still need to find:"
        : "You've also yet to find:";
    if (unowned.length > 0)
        html += `${uStatus} <ul>${unowned.map(w => `<li class="wpn">${w.name}</li>`).join("")}</ul>`;
    sumMaterials.innerHTML = html;
}

function nav(id) {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    $(`button[data-tab=${id}]`)?.classList.add("active");
    tabs.forEach(tab => tab.classList.add("hide"));
    document.getElementById(id).classList.remove("hide");
}

////////////////// event hooks //////////////////

tabButtons.forEach(btn =>
    btn.addEventListener("click", () => nav(btn.dataset.tab)));

$("#sum_hide").addEventListener("click", e => {
    let hidden = sumMaterials.classList.toggle("hide_sufficient");
    e.target.innerHTML = `${hidden ? "Show" : "Hide"} sufficient`;
});

$("#sum_copy").addEventListener("click", () => summaryExport(false));
$("#sum_download").addEventListener("click", () => summaryExport(true));

sumLevels.forEach((btn, i) => {
    btn.addEventListener("click", () => {
        save.summaryLevel = i + 2;
        summaryDisplay();
    });
});