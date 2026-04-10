// ==UserScript==
// @name         TikTok All Reposted Videos Remover - Darkvoid by ragz
// @namespace    https://github.com/ragz
// @version      1.1
// @description  Hapus semua repost TikTok otomatis - versi web (MIX Darkvoid)
// @author       MIX
// @match        https://*.tiktok.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getSecUid() {
    try {
      const data = window.__$UNIVERSAL_DATA$__;
      return data?.__DEFAULT_SCOPE__?.['webapp.app-context']?.user?.secUid || null;
    } catch(e) { return null; }
  }

  async function getRepostItems(cursor = 0, secUid) {
    if (!secUid) return null;
    const params = new URLSearchParams({
      aid: "1988", count: "30", coverFormat: "2", cursor: String(cursor),
      needPinnedItemIds: "true", post_item_list_request_type: "0", secUid
    });

    const res = await fetch(`https://www.tiktok.com/api/repost/item_list/?${params}`);
    const json = await res.json();
    if (json.status_code !== 0) return null;

    const items = (json.itemList || []).map(e => ({
      id: e.id,
      authorName: `@${e.author?.uniqueId || ''}`,
      desc: e.desc || '',
      url: `https://www.tiktok.com/@\( {e.author?.uniqueId || ''}/video/ \){e.id}`
    }));

    return {
      hasMore: !!json.hasMore,
      nextCursor: json.cursor != null ? String(json.cursor) : null,
      items
    };
  }

  async function deleteRepost(itemId) {
    const params = new URLSearchParams({ aid: "1988", item_id: String(itemId) });
    const res = await fetch(`https://www.tiktok.com/tiktok/v1/upvote/delete?${params}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: ""
    });
    const json = await res.json();
    return json.status_code === 0;
  }

  // === PANEL GELAP ===
  function createPanel() {
    const id = 'darkvoid-repost-panel';
    if (document.getElementById(id)) return;

    const panel = document.createElement('div');
    panel.id = id;
    panel.style.cssText = `
      position:fixed;top:20px;right:20px;width:340px;background:#111;border:2px solid #00f2ea;
      border-radius:16px;box-shadow:0 0 30px #00f2ea;font-family:system-ui;color:#fff;z-index:2147483647;
      overflow:hidden;
    `;
    panel.innerHTML = `
      <div style="background:#1a1a1a;padding:12px 16px;font-weight:700;display:flex;justify-content:space-between;">
        <span>MIX DARKVOID REPOST KILLER</span>
        <span id="close-panel" style="cursor:pointer;color:#ff0050;">✕</span>
      </div>
      <div id="status" style="padding:16px;font-size:14px;"></div>
      <div style="padding:0 16px 16px;display:flex;gap:8px;">
        <button id="start-btn" style="flex:1;background:#00f2ea;color:#000;padding:12px;border-radius:8px;font-weight:700;">START HANCURKAN REPOST</button>
        <button id="pause-btn" style="flex:1;background:#ff0050;padding:12px;border-radius:8px;font-weight:700;display:none;">PAUSE</button>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('close-panel').onclick = () => panel.remove();
  }

  // Jalankan otomatis
  window.addEventListener('load', () => {
    createPanel();

    let isRunning = false, paused = false, totalRemoved = 0;

    const statusEl = document.getElementById('status');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    startBtn.onclick = async () => {
      if (isRunning) return;
      const secUid = getSecUid();
      if (!secUid) {
        statusEl.innerHTML = `<span style="color:#ff0050;">❌ Login dulu ke TikTok bro!</span>`;
        return;
      }

      isRunning = true;
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
      statusEl.innerHTML = `🔥 Sedang nge-list repost...`;

      let cursor = 0;
      while (isRunning) {
        if (paused) { await sleep(1000); continue; }

        const data = await getRepostItems(cursor, secUid);
        if (!data || !data.items.length) break;

        for (const item of data.items) {
          if (!isRunning || paused) break;
          const success = await deleteRepost(item.id);
          if (success) {
            totalRemoved++;
            statusEl.innerHTML = `🪓 Dihapus: <b>${totalRemoved}</b> repost`;
          }
          await sleep(2200 + Math.random() * 800); // delay aman
        }

        if (!data.hasMore) break;
        cursor = data.nextCursor;
      }

      statusEl.innerHTML = `✅ SELESAI. Total dihapus: <b>${totalRemoved}</b>`;
      isRunning = false;
      startBtn.style.display = 'block';
      pauseBtn.style.display = 'none';
    };

    pauseBtn.onclick = () => {
      paused = !paused;
      pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
    };
  });
})();
