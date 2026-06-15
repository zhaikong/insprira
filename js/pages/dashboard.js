import { localApi } from '../api.js';
import { LS } from '../state.js';
import { esc, proxyImage } from '../utils.js';
import { platName } from '../config.js';
import { skeleton, rankBadge } from '../components.js';
import { initIcons } from '../icons.js';
import { adaptDY, adaptXHS, adaptGZH } from '../core/adapters.js';

export async function renderDashboard() {
  const view = Object.fromEntries([
    'dash-dy', 'dash-xhs', 'dash-gzh', 'dash-dy-status', 'dash-xhs-status',
    'dash-gzh-status', 'stat-hot', 'stat-track', 'stat-track-sub',
  ].map(id => [id, document.getElementById(id)]));
  if (!view['dash-dy']) return;
  ['dash-dy','dash-xhs','dash-gzh'].forEach(id => { if (view[id]) view[id].innerHTML = skeleton(5); });
  if (view['dash-dy-status']) view['dash-dy-status'].textContent = '加载中…';
  if (view['dash-xhs-status']) view['dash-xhs-status'].textContent = '加载中…';
  if (view['dash-gzh-status']) view['dash-gzh-status'].textContent = '加载中…';

  try {
    const [dyResult, xhsResult, gzhResult, kwResult] = await Promise.all([
      localApi('hot/list?platform=dy'),
      localApi('hot/list?platform=xhs'),
      localApi('hot/list?platform=gzh'),
      localApi('hot/keywords'),
    ]);
    if (!view['dash-dy'] || !view['dash-dy'].isConnected) return;

    const fill = (containerId, statusId, result, adapt, emoji) => {
      const c = view[containerId];
      const s = view[statusId];
      if (!c) return;
      if (result?.length) {
        const list = result.slice(0, 5).map(item => adapt(item.raw));
        list.forEach((it, i) => it._rank = i + 1);
        c.innerHTML = list.map(it => `
          <a class="flex items-center gap-2.5 hover:bg-white/[0.03] -mx-2 px-2 py-1.5 rounded cursor-pointer" data-action="showDetail" data-plat="${esc(it.plat)}" data-work-id="${esc(it.workId)}">
            ${rankBadge(it._rank)}
            <div class="flex-1 min-w-0 text-xs">
              <div class="truncate font-medium">${esc(it.title)}</div>
              <div class="text-gray-500 mt-0.5">${emoji} ${esc(it.like || it.read)} · ${esc(it.author || '')}</div>
            </div>
          </a>`).join('');
        if (s) s.innerHTML = `${list.length} 条 · ${esc(result.sourceLabel || '本地缓存数据')}`;
      } else {
        c.innerHTML = '<div class="text-xs text-gray-500 py-4 text-center">暂无数据</div>';
        if (s) s.textContent = '无数据';
      }
    };

    fill('dash-dy', 'dash-dy-status', dyResult, adaptDY, '🔥');
    fill('dash-xhs', 'dash-xhs-status', xhsResult, adaptXHS, '❤️');
    fill('dash-gzh', 'dash-gzh-status', gzhResult, adaptGZH, '👁');

    if (view['stat-hot']) view['stat-hot'].textContent = kwResult?.length || '—';

    const trackers = LS.get('trackers', []);
    if (view['stat-track']) view['stat-track'].textContent = trackers.length;
    if (view['stat-track-sub']) view['stat-track-sub'].textContent = trackers.length ? '点击查看' : '点击添加';
    renderFeedAndHistory();

    initIcons(document.getElementById('content-area'));
  } catch (e) {
    if (view['dash-dy']?.isConnected) {
      ['dash-dy','dash-xhs','dash-gzh'].forEach(id => {
        if (view[id]) view[id].innerHTML = `<div class="text-xs text-red-400 py-4 text-center">${esc(e.message || '加载失败')}</div>`;
      });
    }
  }
}

export function renderFeedAndHistory() {
  const trackers = LS.get('trackers', []);
  const feedEl = document.getElementById('dash-feed');
  const hisEl = document.getElementById('dash-history');
  const searchStat = document.getElementById('stat-search');
  if (!feedEl || !hisEl || !searchStat) return;
  if (trackers.length === 0) {
    feedEl.innerHTML = `<div class="text-center py-8 text-sm text-gray-500">
      <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 opacity-30"></i>
      <div>还没有关注账号</div>
      <button class="btn btn-primary mt-3 py-1.5 text-xs" data-action="openAddAccountModal">添加账号</button>
    </div>`;
  } else {
    feedEl.innerHTML = trackers.slice(0, 4).map(t => {
      const avatar = proxyImage(t.gzhAvatar);
      return `
      <div class="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg">
        <div class="cover-thumb">${esc((t.name||'?')[0])}${avatar ? `<img src="${avatar}" alt="" data-image-error="remove" />` : ''}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-sm">${esc(t.name)}</span>
            <span class="pill ${t.plat==='dy'?'pill-hot':t.plat==='xhs'?'pill-brand':'pill-green'}">${platName(t.plat)}</span>
            ${t.gzhRedfoxIndex ? `<span class="pill pill-amber">红狐 ${parseFloat(t.gzhRedfoxIndex).toFixed(0)}</span>` : ''}
          </div>
          <div class="text-xs text-gray-400">${esc(t.gzhVerify || t.id)} · ${esc(t.group || '其他')}</div>
        </div>
        <button class="btn btn-ghost text-xs py-1" data-action="removeTracker" data-id="${t.id}">移除</button>
      </div>`;
    }).join('');
  }

  // 搜索历史
  const history = LS.get('searchHistory', []);
  if (history.length === 0) {
    hisEl.innerHTML = '<div class="text-xs text-gray-500 text-center py-4">还没有搜索记录</div>';
  } else {
    hisEl.innerHTML = history.slice(0, 6).map(h => `
      <a class="flex items-center gap-2.5 p-2 -mx-2 rounded hover:bg-white/[0.03] cursor-pointer" data-action="doSearchWith" data-kw="${esc(h.kw)}">
        <i data-lucide="search" class="w-3.5 h-3.5 text-gray-500"></i>
        <div class="flex-1 min-w-0">
          <div class="text-sm truncate">${esc(h.kw)}</div>
          <div class="text-[10px] text-gray-500">${esc(h.at)} · ${esc(h.plats.join('/'))}</div>
        </div>
        <i data-lucide="arrow-up-right" class="w-3 h-3 text-gray-600"></i>
      </a>`).join('');
  }
  searchStat.textContent = history.length;
}
