const SAVE_SIZE = 235980;
const SAVE_WEAPONS = 0x31D70;
const SAVE_ITEMS = 0x30570;
const SAVE_ITEMCOUNT = 256;
const ERR_READFAIL = "Failed to read save!";
const hex = x => "0x" + Number(x).toString(16).padStart(5, "0").toUpperCase();

const dropzone = $("#load");
const filesel = $("#file");

function savePrompt() {
    filesel.click();
}

async function saveOpen(file) {
    try {
        let buffer = await file.arrayBuffer();
        saveParse(buffer);
    }
    catch (e) {
        if (e instanceof DOMException) setError(ERR_READFAIL,
            `Your browser could not read the file: ${e.message}`);
        else showError(e);
    }
}

function saveParse(buffer) {
    try {
        if (buffer.byteLength !== SAVE_SIZE) return setError(ERR_READFAIL,
            `Invalid file size. Expected ${SAVE_SIZE} bytes, got ${buffer.byteLength}.<br>
            Are you sure this is the right file (SlotData_<i>#</i>.dat)?`);
        const data = new DataView(buffer);

        save.weapons.length = 0;
        for (let i = 0; i < Object.keys(WEAPONS).length; i++) {
            const cur = SAVE_WEAPONS + 20 * i;
            const id = data.getInt32(cur, true);
            const weapon = WEAPONS[id];
            if (weapon == null) continue;
            const level = data.getInt32(cur + 4, true);
            if (level < 1 || level > 4) return setError(ERR_READFAIL,
                `<i>${weapon.name}</i> (ID ${id}) at offset ${hex(cur)} has invalid level (${level}).`);
            save.weapons.push({id, name: weapon.name, level});
        }
        const unowned =
            Object.keys(WEAPONS).filter(id => !save.weapons.some(w => w.id === +id));
        for (const id of unowned)
            save.weapons.push({id: +id, name: WEAPONS[id].name, level: 0});

        save.items.length = 0;
        for (let i = 0; i < SAVE_ITEMCOUNT; i++) {
            const cur = SAVE_ITEMS + 12 * i;
            const id = data.getInt32(cur, true);
            const item = ITEMS[id];
            if (item == null) continue;
            const count = data.getInt32(cur + 8, true);
            if (count < 0) return setError(ERR_READFAIL,
                `<i>${item}</i> (ID ${id}) at offset ${hex(cur)} has invalid quantity (${count}).`);
            save.items.push({id, name: item, count});
        }

        $$(".weapon").forEach(w => w.remove());
        displayWeaponList();
        summaryDisplay();
        setError(null);
        $("#stats").classList.remove("hide");
    } catch (e) {showError(e);}
}

////////////////// event hooks //////////////////

filesel.addEventListener("change", e => saveOpen(e.target.files[0]));

for (const evt of ["dragenter", "dragover", "dragleave", "drop"])
    dropzone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
    });

dropzone.addEventListener("dragover", () =>
    dropzone.classList.add("active"));
dropzone.addEventListener("dragleave", () =>
    dropzone.classList.remove("active"));
dropzone.addEventListener("drop", () =>
    dropzone.classList.remove("active"));

dropzone.addEventListener("drop", e => {
    let files = [...e.dataTransfer.files];
    if (files.length > 1)
        return setError("Error", "Please upload one file!");
    saveOpen(files[0]);
});