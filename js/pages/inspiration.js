import { localApi } from '../api.js';
import { LS } from '../state.js';
import { esc, fmt, safeExternalUrl } from '../utils.js';
import { platName } from '../config.js';
import { skeleton, toast } from '../components.js';
import { initIcons } from '../icons.js';
import { renderInspirationConfigs } from './settings.js';
import { gotoPage } from '../navigation.js';

export async function renderInspiration() {
  const listEl = document.getElementById('inspiration-list');
  const emptyEl = document.getElementById('inspiration-empty');
  if (!listEl) return;
  listEl.innerHTML = skeleton(4);
  try {
    const filter = document.getElementById('inspirationFilter')?.value || 'all';
    const ideas = await localApi(filter === 'trash' ? 'inspirations?deleted=1' : 'inspirations');
    if (!listEl.isConnected) return;
    window._inspirations = ideas;
    const status = document.getElementById('inspiration-status');
    if (status) status.textContent = `${ideas.length} 个选题`;
    const navCount = document.getElementById('nav-inspiration-count');
    if (navCount) navCount.textContent = ideas.length;
    if (!ideas.length) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    renderInspirationCards();
  } catch (e) {
    if (listEl.isConnected) listEl.innerHTML = `<div class="lg:col-span-2 text-center text-red-400 py-8">${esc(e.message)}</div>`;
  }
}

export function renderInspirationCards() {
  const listEl = document.getElementById('inspiration-list');
  if (!listEl) return;
  const filter = document.getElementById('inspirationFilter')?.value || 'all';
  const ideas = (window._inspirations || []).filter(idea =>
    filter === 'trash'
    || filter === 'all'
    || (filter === 'favorite' && idea.isFavorite)
    || idea.feedbackState === filter
  );
  document.getElementById('inspiration-trash-toolbar')?.classList.toggle('hidden', filter !== 'trash');
  listEl.innerHTML = ideas.map(idea => `
      <div class="glass rounded-xl p-4" data-inspiration-id="${esc(idea.id)}">
        <div class="flex items-start gap-3">
          ${filter === 'trash' ? `<input type="checkbox" class="accent-red-500 mt-2 trash-select" value="${esc(idea.id)}">` : ''}
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center flex-shrink-0"><i data-lucide="lightbulb" class="w-4 h-4"></i></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1.5">
              <span class="pill pill-amber">${esc(idea.angle || '选题')}</span>
              <span class="pill pill-brand">${esc(idea.targetPlatform || '多平台')}</span>
              <span class="pill ${idea.generationType === 'cron' ? 'pill-sky' : 'pill-gray'}">${idea.generationType === 'cron' ? '自动生成' : '手动生成'}</span>
              ${idea.sourceMode === 'llm-reasoning'
                ? '<span class="pill pill-amber" title="本轮没有检索到可用热点证据，仅由大模型结合赛道和关键词推理"><i data-lucide="brain" class="w-3 h-3"></i>无热点 · 模型推理</span>'
                : idea.sourceMode === 'hot-evidence'
                  ? '<span class="pill pill-green"><i data-lucide="database" class="w-3 h-3"></i>热点证据</span>'
                  : ''}
              ${idea.kbLink ? `<span class="pill pill-green" title="创作时会读取该知识库条目作为参考上下文：${esc(idea.kbLink.entry_key || idea.kbLink.entryKey || '')}"><i data-lucide="book-open" class="w-3 h-3"></i>知识库参考</span>` : ''}
              <span class="text-[10px] text-gray-600">${new Date(idea.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            <h3 class="font-semibold leading-snug">${esc(idea.title)}</h3>
            <p class="text-xs text-gray-400 leading-relaxed mt-2">${esc(idea.summary)}</p>
            ${idea.generationNote ? `<div class="text-[11px] mt-2 ${idea.sourceMode === 'llm-reasoning' ? 'text-amber-300/80' : 'text-gray-500'}">${esc(idea.generationNote)}</div>` : ''}
            <div class="flex items-center gap-1.5 flex-wrap mt-3">
              ${(idea.sourceKeywords || []).map(keyword => `<span class="tag"># ${esc(keyword)}</span>`).join('')}
            </div>
            ${(idea.sourceItems || []).length ? `<details class="mt-3 text-xs text-gray-500">
              <summary class="cursor-pointer text-cyan-400">查看参考证据（${idea.sourceItems.length}）</summary>
              <div class="space-y-1.5 mt-2">
                ${idea.sourceItems.map(item => `<a href="${safeExternalUrl(item.url)}" target="_blank" rel="noopener noreferrer" class="block hover:text-gray-300" title="${esc(`${platName(item.platform) || item.platform || '未知平台'} · ${item.dataDate || item.publishTime || ''} · ${item.title} · ${item.author || '未知作者'} · ${fmt(item.readCount)}`)}">· ${esc(item.title)} · ${esc(item.author || '未知作者')} · ${platName(item.platform) || item.platform || ''} · ${fmt(item.readCount)}</a>`).join('')}
              </div>
            </details>` : ''}
            <div class="flex items-center gap-2 mt-3">
              ${filter === 'trash' ? `
              <button class="btn btn-ghost py-1 px-2 text-xs text-emerald-300" data-action="restoreInspiration" data-id="${idea.id}" title="恢复"><i data-lucide="rotate-ccw" class="w-3 h-3"></i>恢复</button>
              <button class="btn btn-ghost py-1 px-2 text-xs text-red-400" data-action="permanentlyDeleteInspiration" data-id="${idea.id}" title="永久删除"><i data-lucide="trash-2" class="w-3 h-3"></i>永久删除</button>
              ` : `<select class="input py-1 text-xs inspiration-status-select" style="width:auto" data-id="${idea.id}">
                ${['待研究','创作中','已发布','已归档'].map(status => `<option ${status===idea.status?'selected':''}>${status}</option>`).join('')}
              </select>
              <button class="btn btn-ghost py-1 px-2 text-xs ${idea.isFavorite ? 'text-amber-300' : ''}" data-action="toggleInspirationFavorite" data-id="${idea.id}" data-favorite="${idea.isFavorite ? 'false' : 'true'}" title="收藏"><i data-lucide="bookmark" class="w-3 h-3"></i></button>
              <button class="btn btn-ghost py-1 px-2 text-xs ${idea.feedbackState === 'like' ? 'text-emerald-300' : ''}" data-action="feedbackInspiration" data-id="${idea.id}" data-state="${idea.feedbackState === 'like' ? 'none' : 'like'}" title="感兴趣"><i data-lucide="thumbs-up" class="w-3 h-3"></i></button>
              <button class="btn btn-ghost py-1 px-2 text-xs ${idea.feedbackState === 'dislike' ? 'text-red-300' : ''}" data-action="feedbackInspiration" data-id="${idea.id}" data-state="${idea.feedbackState === 'dislike' ? 'none' : 'dislike'}" title="不感兴趣"><i data-lucide="thumbs-down" class="w-3 h-3"></i></button>
              <button class="btn btn-ghost py-1 px-2 text-xs ${idea.feedbackState === 'block' ? 'text-red-400' : ''}" data-action="feedbackInspiration" data-id="${idea.id}" data-state="${idea.feedbackState === 'block' ? 'none' : 'block'}" title="加入关键词黑名单"><i data-lucide="ban" class="w-3 h-3"></i></button>
              <button class="btn btn-ghost py-1 px-2 text-xs text-red-400" data-action="trashInspiration" data-id="${idea.id}" title="移入回收站"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
              <button class="btn btn-primary py-1 text-xs ml-auto" data-action="sendIdeaToCreator" data-id="${idea.id}"><i data-lucide="pen-line" class="w-3 h-3"></i>开始创作</button>
              `}
            </div>
          </div>
        </div>
      </div>`).join('') || '<div class="lg:col-span-2 text-center text-gray-500 py-10">当前筛选下没有选题</div>';
  initIcons(document.getElementById('content-area'));
  updateTrashSelection();
}

export async function onInspirationFilterChange() {
  await renderInspiration();
}

export async function trashInspiration(id) {
  if (!confirm('将该选题移入回收站？')) return;
  try {
    await localApi(`inspirations/${encodeURIComponent(id)}/trash`, { method: 'POST', body: {} });
    window._inspirations = (window._inspirations || []).filter(item => item.id !== id);
    document.querySelector(`[data-inspiration-id="${CSS.escape(id)}"]`)?.remove();
    updateInspirationListStatus();
    toast('已移入回收站', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

export async function restoreInspiration(id) {
  try {
    await localApi(`inspirations/${encodeURIComponent(id)}/restore`, { method: 'POST', body: {} });
    window._inspirations = (window._inspirations || []).filter(item => item.id !== id);
    document.querySelector(`[data-inspiration-id="${CSS.escape(id)}"]`)?.remove();
    updateInspirationListStatus();
    toast('选题已恢复', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

export async function permanentlyDeleteInspiration(id) {
  if (!confirm('永久删除后无法恢复，确定继续？')) return;
  try {
    await localApi(`inspirations/${encodeURIComponent(id)}/permanent`, { method: 'POST', body: {} });
    window._inspirations = (window._inspirations || []).filter(item => item.id !== id);
    document.querySelector(`[data-inspiration-id="${CSS.escape(id)}"]`)?.remove();
    updateInspirationListStatus();
    toast('已永久删除', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

export function updateInspirationListStatus() {
  const count = (window._inspirations || []).length;
  const status = document.getElementById('inspiration-status');
  if (status) status.textContent = `${count} 个选题`;
  const list = document.getElementById('inspiration-list');
  if (list && !list.querySelector('[data-inspiration-id]')) {
    list.innerHTML = '<div class="lg:col-span-2 text-center text-gray-500 py-10">当前筛选下没有选题</div>';
  }
  const navCount = document.getElementById('nav-inspiration-count');
  if (navCount && document.getElementById('inspirationFilter')?.value !== 'trash') navCount.textContent = count;
}

export function updateTrashSelection() {
  const boxes = [...document.querySelectorAll('.trash-select')];
  const selected = boxes.filter(box => box.checked);
  const count = document.getElementById('trash-selected-count');
  if (count) count.textContent = `已选择 ${selected.length} 项`;
  const all = document.getElementById('trash-select-all');
  if (all) {
    all.checked = boxes.length > 0 && selected.length === boxes.length;
    all.indeterminate = selected.length > 0 && selected.length < boxes.length;
  }
}

export function toggleAllTrash(checked) {
  document.querySelectorAll('.trash-select').forEach(box => { box.checked = checked; });
  updateTrashSelection();
}

export async function batchDeleteTrash() {
  const ids = [...document.querySelectorAll('.trash-select:checked')].map(box => box.value);
  if (!ids.length) { toast('请先选择要删除的选题', 'error'); return; }
  if (!confirm(`永久删除选中的 ${ids.length} 个选题？此操作无法恢复。`)) return;
  const results = await Promise.allSettled(ids.map(id =>
    localApi(`inspirations/${encodeURIComponent(id)}/permanent`, { method: 'POST', body: {} })
  ));
  const deleted = ids.filter((id, index) => results[index].status === 'fulfilled');
  window._inspirations = (window._inspirations || []).filter(item => !deleted.includes(item.id));
  deleted.forEach(id => document.querySelector(`[data-inspiration-id="${CSS.escape(id)}"]`)?.remove());
  updateInspirationListStatus();
  updateTrashSelection();
  const failed = ids.length - deleted.length;
  toast(failed ? `已删除 ${deleted.length} 项，${failed} 项失败` : `已永久删除 ${deleted.length} 项`, failed ? 'error' : 'success');
}

export async function toggleInspirationFavorite(id, favorite) {
  await localApi(`inspirations/${encodeURIComponent(id)}/favorite`, { method: 'POST', body: { favorite } });
  const idea = (window._inspirations || []).find(item => item.id === id);
  if (idea) idea.isFavorite = favorite;
  renderInspirationCards();
}

export async function feedbackInspiration(id, type) {
  try {
    await localApi(`inspirations/${encodeURIComponent(id)}/feedback`, { method: 'POST', body: { type } });
    const idea = (window._inspirations || []).find(item => item.id === id);
    if (idea) idea.feedbackState = type === 'none' ? '' : type;
    toast(type === 'like' ? '已提高相关关键词权重' : type === 'dislike' ? '已降低相关关键词权重' : type === 'block' ? '相关关键词已加入黑名单' : '已撤销反馈', 'success');
    renderInspirationCards();
    const configs = await localApi('inspiration-configs');
    window._inspirationConfigs = configs;
    renderInspirationConfigs();
  } catch (e) { toast(e.message, 'error'); }
}

export async function generateInspirations() {
  const domain = document.getElementById('inspirationDomain').value.trim();
  const keywords = document.getElementById('inspirationKeywords').value.split(/[,，、\n]/).map(x => x.trim()).filter(Boolean);
  document.getElementById('inspiration-status').textContent = '正在生成选题…';
  try {
    const result = await localApi('inspirations/generate', { method: 'POST', body: { domain, keywords, count: 6 } });
    const searches = result.research?.searches || [];
    const sourceLabels = {
      api: 'API',
      database: '本地缓存',
      'skipped-budget': '预算跳过',
      'api-failed': 'API 失败',
    };
    const ranges = searches.map(item => {
      const mode = item.mode === 'deep' ? '深度' : '组合';
      const keywords = (item.keywords || [item.keyword]).join('、');
      return `${mode}搜索 ${keywords}（近${item.days}天 ${item.count}篇，${sourceLabels[item.source] || item.source}）`;
    }).join('；');
    const budget = result.research?.apiBudget;
    const cost = budget ? `本轮 API ${budget.usedThisRun}/${budget.limit} 次` : '';
    const basis = result.sourceMode === 'llm-reasoning'
      ? '未找到热点证据，本轮为纯大模型推理'
      : `使用 ${result.research?.articleCount || 0} 条热点证据`;
    const duplicates = result.duplicateCount ? `；过滤 ${result.duplicateCount} 条重复选题` : '';
    const engine = document.getElementById('inspiration-engine');
    if (engine) engine.textContent = `${basis}，由 ${result.generatedBy} 生成。${cost}${ranges ? `；${ranges}` : ''}${duplicates}`;
    toast(`已生成 ${result.ideas.length} 个选题`, 'success');
    await renderInspiration();
  } catch (e) {
    toast(e.message, 'error');
    document.getElementById('inspiration-status').textContent = '生成失败';
  }
}

export async function updateInspirationStatus(id, status) {
  try {
    await localApi(`inspirations/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
  } catch (e) {
    toast(e.message, 'error');
  }
}

export async function sendIdeaToCreator(id) {
  const idea = (window._inspirations || []).find(item => item.id === id);
  if (!idea) return;
  let knowledgeText = '';
  if (idea.kbLink?.entry_key) {
    try {
      const entry = await localApi(`kb/entries/${encodeURIComponent(idea.kbLink.entry_key)}`);
      knowledgeText = `\n\n参考知识库：${entry.title}\n${entry.content || ''}`;
    } catch (error) {
      toast('知识库参考加载失败，将仅使用选题信息', 'error');
    }
  }
  LS.set('creatorSource', {
    plat: 'idea',
    title: idea.title,
    summary: `${idea.summary}${knowledgeText}`,
    author: idea.angle,
    sourceKeywords: idea.sourceKeywords,
    kbLink: idea.kbLink,
  });
  gotoPage('creator');
}
