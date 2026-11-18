/* Bright Little Eyes: one parent PIN for the grown-up areas.
   The PIN is saved (scrambled) on this device and shared by every app on this website, so it only has to be set once. */
(function () {
  const KEY = "bleParentPin", SALT = "ble-parent:";
  let okUntil = 0;
  async function hash(s) {
    try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
    catch (e) { return "p" + s; }
  }
  const st = document.createElement("style");
  st.textContent = `
    .blepin-scrim{position:fixed;inset:0;background:rgba(20,30,28,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px}
    .blepin-card{background:var(--surface,#fff);color:var(--ink,#222);border-radius:20px;padding:22px;width:min(340px,100%);text-align:center;display:grid;gap:10px;font:16px system-ui,-apple-system,sans-serif}
    .blepin-card h2{margin:0;font-size:24px}
    .blepin-card p{margin:0;color:var(--muted,#666)}
    .blepin-dots{display:flex;justify-content:center;gap:14px;min-height:24px;align-items:center}
    .blepin-dots span{width:18px;height:18px;border-radius:50%;border:2px solid #999}
    .blepin-dots span.on{background:var(--accent,#2f7d6d);border-color:var(--accent,#2f7d6d)}
    .blepin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .blepin-pad button{font:600 22px system-ui,-apple-system,sans-serif;padding:14px 0;border-radius:12px;border:2px solid var(--line,#ccc);background:var(--surface,#fff);color:var(--ink,#222);cursor:pointer}
    .blepin-pad button.q{font-size:15px;color:var(--muted,#666)}`;
  document.head.appendChild(st);

  function ask(onOk) {
    let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
    const creating = !saved; let first = null, entry = "";
    const d = document.createElement("div");
    d.className = "blepin-scrim"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.innerHTML = `<div class="blepin-card"><h2></h2><p></p><div class="blepin-dots"></div><div class="blepin-pad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join("")}
      <button type="button" class="q" data-k="x">Cancel</button><button type="button" data-k="0">0</button><button type="button" class="q" data-k="b" aria-label="Delete">⌫</button></div></div>`;
    document.body.appendChild(d);
    const title = d.querySelector("h2"), msg = d.querySelector("p");
    const dots = () => { d.querySelector(".blepin-dots").innerHTML = [0, 1, 2, 3].map(i => `<span class="${i < entry.length ? "on" : ""}"></span>`).join(""); };
    const restart = m => { entry = ""; msg.textContent = m; setTimeout(dots, 200); };
    title.textContent = creating ? "Create a parent PIN" : "Grown-ups only";
    msg.textContent = creating ? "Pick 4 numbers. The same PIN opens the parent areas in all your apps on this device." : "Enter the parent PIN.";
    dots();
    const done = () => { d.remove(); okUntil = Date.now() + 10 * 60000; onOk(); };
    d.querySelectorAll("[data-k]").forEach(b => b.onclick = async () => {
      const k = b.dataset.k;
      if (k === "x") return d.remove();
      if (k === "b") { entry = entry.slice(0, -1); return dots(); }
      if (entry.length >= 4) return;
      entry += k; dots();
      if (entry.length < 4) return;
      if (creating && first === null) { first = entry; return restart("Type the same 4 numbers again."); }
      if (creating) {
        if (entry !== first) { first = null; return restart("Those didn't match. Pick 4 numbers again."); }
        try { localStorage.setItem(KEY, await hash(entry)); } catch (e) {}
        return done();
      }
      if (await hash(entry) === saved) return done();
      restart("That PIN isn't right. Try again.");
    });
  }
  async function setPin(v) { if (/^\d{4}$/.test(String(v))) try { localStorage.setItem(KEY, await hash(String(v))); } catch (e) {} }
  /* a placeholder for an app's parent page while the PIN pad is up (or after Cancel) */
  const waitHTML = () => `<div style="max-width:420px;margin:40px auto;text-align:center;display:grid;gap:12px;font:17px system-ui,-apple-system,sans-serif">
    <div style="font-size:44px">👪</div><h1 style="margin:0;font-size:28px">Grown-ups only</h1>
    <p style="margin:0;opacity:.75">This part is for a parent. It needs the parent PIN.</p>
    <div><button type="button" data-blepin-again class="btn">Enter PIN</button></div></div>`;
  function bindAgain(host, ok) { const b = host.querySelector("[data-blepin-again]"); if (b) b.onclick = () => ask(ok); }
  window.BLEPin = { ask, setPin, waitHTML, bindAgain, unlocked: () => Date.now() < okUntil, lock: () => { okUntil = 0; }, keep: () => { okUntil = Date.now() + 10 * 60000; } };

  /* ---- Bible "All subjects" page: the backup box is for grown-ups only ---- */
  const hubBox = document.getElementById("mk") && document.getElementById("mk").closest("section.box");
  if (hubBox) {
    hubBox.hidden = true;
    const intro = hubBox.querySelector("p");
    if (intro) intro.textContent = "One code that holds progress in all four subjects. Make one every week or two and keep it somewhere safe. If progress is ever lost, or you move to a new device, paste it below.";
    const open = document.createElement("div");
    open.style.cssText = "text-align:center;margin-top:18px";
    open.innerHTML = `<button class="btn ghost" type="button">Parent: back up or restore</button>`;
    hubBox.before(open);
    const lock = document.createElement("div");
    lock.style.cssText = "text-align:center;margin-top:12px"; lock.hidden = true;
    lock.innerHTML = `<button class="btn ghost" type="button">Lock parent area</button>`;
    hubBox.after(lock);
    open.firstElementChild.onclick = () => ask(() => { hubBox.hidden = false; lock.hidden = false; open.hidden = true; });
    lock.firstElementChild.onclick = () => { hubBox.hidden = true; lock.hidden = true; open.hidden = false; okUntil = 0; };
  }

  /* ---- Bible & history apps: a Parent button replaces Settings. Behind the PIN: her work, settings, and backup codes. ---- */
  const setBtn = document.getElementById("setBtn");
  if (!setBtn || typeof renderSettings !== "function") return;
  const nb = setBtn.cloneNode(true);
  nb.textContent = "Parent"; nb.setAttribute("aria-label", "Parent area");
  setBtn.replaceWith(nb);
  nb.addEventListener("click", () => { const open = () => go({ name: "settings" }); BLEPin.unlocked() ? open() : ask(open); });

  const esc2 = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function workCard() {
    const lessons = {};
    try { Object.values(EMBED).forEach(arr => arr.forEach(l => { lessons[l.id] = l; })); } catch (e) {}
    const rows = Object.entries(progress.done || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    const sc = rows.reduce((a, [, d]) => [a[0] + (d.score || 0), a[1] + (d.total || 0)], [0, 0]);
    const written = (l, d) => {
      if (d.assignment != null) return d.assignment ? `<p><b>${esc2(l && l.assignment || "Assignment")}</b><br>${esc2(d.assignment)}</p>` : "";
      return (d.notes || []).map((a, i) => a ? `<p><b>${esc2(l && l.think && l.think[i] || "Answer " + (i + 1))}</b><br>${esc2(a)}</p>` : "").join("");
    };
    const sec = document.createElement("section");
    sec.className = "card";
    sec.innerHTML = `<h2>Parent area: her work</h2>
      <p class="status">${rows.length} lesson${rows.length === 1 ? "" : "s"} finished${sc[1] ? ` · quizzes ${Math.round(sc[0] / sc[1] * 100)}% right overall` : ""}. Newest first. Tap a lesson to read what she wrote.</p>
      ${rows.map(([id, d]) => { const l = lessons[id], w = written(l, d);
        return `<details style="border-top:1px solid var(--line,#ddd);padding:8px 0"><summary style="cursor:pointer"><b>${esc2(l ? l.title : id)}</b> · ${d.at ? new Date(d.at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} · quiz ${d.score}/${d.total}</summary>
          <div style="margin-top:6px">${w || '<p class="status">Nothing written for this lesson.</p>'}</div></details>`; }).join("") || "<p>No lessons finished yet.</p>"}`;
    return sec;
  }
  const rs0 = renderSettings;
  renderSettings = function () {
    if (!BLEPin.unlocked()) { go({ name: "home" }); ask(() => go({ name: "settings" })); return; }
    BLEPin.keep();
    rs0();
    const back = $app.querySelector("#back");
    if (back) back.after(workCard()); else $app.prepend(workCard());
    const lock = document.createElement("div");
    lock.style.cssText = "text-align:center;margin-top:14px";
    lock.innerHTML = `<button class="btn ghost" type="button">Lock parent area</button>`;
    lock.firstElementChild.onclick = () => { BLEPin.lock(); go({ name: "home" }); };
    $app.appendChild(lock);
  };
  /* leaving the parent page locks it again */
  const r0 = render;
  render = function () {
    if (!view || view.name !== "settings") BLEPin.lock();
    const out = r0.apply(this, arguments);
    Promise.resolve(out).then(removeNag);
    return out;
  };
  function removeNag() { const b = document.getElementById("bnSet"); const card = b && b.closest(".card"); if (card && /last backup/i.test(card.textContent)) card.remove(); }
  removeNag(); setTimeout(removeNag, 400); setTimeout(removeNag, 1500);   // the first page drew before this file loaded
})();
