// 規則內容在 rules.md，這個檔案只負責把它排成網頁，平常不需要修改。
(function () {
  var app = document.getElementById("app");
  var HERO_KEYS = { "大會名稱": "eyebrow", "活動主標": "title", "副標": "sub", "日期": "date", "地點": "place", "主辦單位": "organizer", "總獎額（萬元）": "total", "總獎額": "total", "獎額說明": "totalNote", "規則最後更新": "updated" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function inl(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }
  function img(k, cls, alt) { return k ? '<img class="' + cls + '" src="img/' + encodeURIComponent(k) + '.webp" alt="' + esc(alt || "") + '">' : ""; }
  function kv(line) { var m = line.match(/^([^：:]+)[：:]\s*(.*)$/); return m ? [m[1].trim(), m[2].trim()] : null; }

  function parse(md) {
    var lines = md.replace(/\r/g, "").split("\n"), i = 0, hero = {}, updated = "", sections = [];
    for (; i < lines.length && !/^##\s+/.test(lines[i].trim()); i++) {
      var p = kv(lines[i].trim()); if (!p) continue;
      var key = HERO_KEYS[p[0]]; if (key === "updated") updated = p[1]; else if (key) hero[key] = p[1];
    }
    var sec = null, block = null;
    function close() { block = null; }
    for (; i < lines.length; i++) {
      var raw = lines[i], t = raw.trim();
      if (/^##\s+/.test(t) && !/^###/.test(t)) {
        sec = { id: "s" + (sections.length + 1), title: t.replace(/^##\s+/, ""), nav: "", img: "", blocks: [] };
        sections.push(sec); close(); continue;
      }
      if (!sec) continue;
      if (!t) { close(); continue; }
      var meta = kv(t);
      if (!sec.blocks.length && meta && (meta[0] === "目錄" || meta[0] === "插圖")) { if (meta[0] === "目錄") sec.nav = meta[1]; else sec.img = meta[1]; continue; }
      if (/^###\s+/.test(t)) { sec.blocks.push({ type: "h", text: t.replace(/^###\s+/, "") }); close(); continue; }
      if (t.charAt(0) === "|") {
        if (/^\|?[\s:\-|]+\|?$/.test(t)) continue;
        var cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
        if (!block || block.type !== "table") { block = { type: "table", rows: [] }; sec.blocks.push(block); }
        block.rows.push(cells); continue;
      }
      if (/^\d+[.、]\s*/.test(t)) {
        if (!block || block.type !== "ol") { block = { type: "ol", items: [] }; sec.blocks.push(block); }
        block.items.push(t.replace(/^\d+[.、]\s*/, "")); continue;
      }
      if (/^[-*•]\s+/.test(t)) {
        if (!block || block.type !== "ul") { block = { type: "ul", items: [] }; sec.blocks.push(block); }
        block.items.push(t.replace(/^[-*•]\s+/, "")); continue;
      }
      if (/^>\s?/.test(t)) {
        var txt = t.replace(/^>\s?/, "");
        if (block && block.type === "note") block.text += txt; else { block = { type: "note", text: txt }; sec.blocks.push(block); }
        continue;
      }
      if (block && block.type === "p") block.text += t; else { block = { type: "p", text: t }; sec.blocks.push(block); }
    }
    return { hero: hero, updated: updated, sections: sections };
  }

  function block(b) {
    if (b.type === "p") return "<p>" + inl(b.text) + "</p>";
    if (b.type === "h") return "<h3>" + inl(b.text) + "</h3>";
    if (b.type === "note") return '<p class="note">' + inl(b.text) + "</p>";
    if (b.type === "ol" || b.type === "ul") return "<" + b.type + ">" + b.items.map(function (x) { return "<li>" + inl(x) + "</li>"; }).join("") + "</" + b.type + ">";
    if (b.type === "table") {
      var r = b.rows;
      return '<div class="tbl"><table><thead><tr>' + r[0].map(function (c) { return "<th>" + inl(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        r.slice(1).map(function (row) { return "<tr>" + row.map(function (c) { return "<td>" + inl(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    }
    return "";
  }

  function view(d) {
    var h = d.hero;
    return '<header class="hero"><div class="hero-in"><div><p class="eyebrow">' + esc(h.eyebrow) + "</p><h1>" + esc(h.title) + '</h1><p class="sub">' + esc(h.sub) + "</p></div>" +
      img("hero", "hero-img", "牙寶探險家") +
      '<div class="facts"><span class="chip">' + esc(h.date) + '</span><span class="chip">' + esc(h.place) + "</span></div>" +
      '<div class="pot"><span>活動獎額合計</span><b>' + esc(h.total) + "</b><span>萬元｜" + esc(h.totalNote) + "</span></div></div></header>" +
      '<nav class="nav" aria-label="規則目錄"><div class="nav-in">' + d.sections.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.nav || s.title) + "</a>"; }).join("") + "</div></nav>" +
      '<main class="wrap">' + d.sections.map(function (s) {
        return '<section class="sec" id="' + s.id + '"><div class="sec-head"><h2>' + esc(s.title) + "</h2>" + img(s.img, "", "") + "</div>" + s.blocks.map(block).join("") + "</section>";
      }).join("") +
      '<footer class="foot"><div>主辦單位　<b>' + esc(h.organizer) + "</b></div><div>規則最後更新：" + esc(d.updated) + "</div><div>掃描集點卡或摸彩券上的 QR Code，隨時查看最新規則。</div></footer></main>";
  }

  fetch("rules.md?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (md) { app.innerHTML = view(parse(md)); if (location.hash) { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); } })
    .catch(function () { app.innerHTML = '<main class="wrap"><section class="sec"><h2>規則載入失敗</h2><p>請重新整理頁面，或洽展場內大會摸彩服務台。</p></section></main>'; });
})();
