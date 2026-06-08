import type { ReportData } from './api';

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function progBar(label: string, value: number, total: number, color: string) {
  const p = pct(value, total);
  return `<div class="prog-row">
    <div class="prog-header"><span class="prog-label">${label}</span><span class="prog-val" style="color:${color}">${value} (${p}%)</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${p}%;background:${color}"></div></div>
  </div>`;
}
function infoBox(cls: string, title: string, body?: string) {
  if (!body) return '';
  return `<div class="info-box ${cls}"><div class="info-box-title">${title}</div><div class="info-box-body">${body}</div></div>`;
}
function secTitle(label: string) {
  return `<div class="section-title">${label}</div>`;
}

const CSS = `
  @page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a2e}
  .page{width:210mm;padding:0}
  .page+.page{page-break-before:always}
  .cover{background:linear-gradient(135deg,#5B3FE0 0%,#8B5CF6 60%,#a78bfa 100%);height:297mm;display:flex;flex-direction:column;justify-content:space-between;padding:50px 48px;position:relative;overflow:hidden}
  .cover-c1{position:absolute;right:-60px;top:-60px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.07)}
  .cover-c2{position:absolute;left:-40px;bottom:80px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.05)}
  .cover-logo{display:flex;align-items:center;gap:12px;margin-bottom:60px}
  .logo-box{width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:flex;align-items:center;justify-content:center}
  .logo-text{font-size:20px;font-weight:900;color:#fff}
  .logo-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:1px}
  .cover-badge{display:inline-block;background:rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700;letter-spacing:2px;padding:6px 14px;border-radius:20px;margin-bottom:20px}
  .cover-title{font-size:36px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:12px}
  .cover-subtitle{font-size:15px;color:rgba(255,255,255,.75);font-weight:500}
  .cover-mid{background:rgba(255,255,255,.12);border-radius:16px;padding:28px 32px}
  .cover-meta-row{display:flex;gap:40px}
  .cover-meta-item{display:flex;flex-direction:column;gap:4px}
  .cover-meta-label{font-size:11px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px;text-transform:uppercase}
  .cover-meta-value{font-size:15px;color:#fff;font-weight:700}
  .cover-bottom{display:flex;justify-content:space-between;align-items:flex-end}
  .cover-conf,.cover-page{font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px}
  .content-page{padding:36px 44px 32px}
  .page-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:2px solid #f0f0f7;margin-bottom:24px}
  .page-header-left{display:flex;align-items:center;gap:10px}
  .page-header-dot{width:8px;height:8px;border-radius:50%;background:#6C47FF}
  .page-header-title{font-size:13px;font-weight:700;color:#6C47FF;letter-spacing:.5px}
  .page-header-right{font-size:11px;color:#9ca3af}
  .section{margin-bottom:22px}
  .section-title{font-size:10px;font-weight:800;color:#6C47FF;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:'';flex:1;height:1px;background:#e5e7eb}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:4px}
  .kpi-card{background:#f8f7ff;border-radius:10px;padding:14px;text-align:center;border:1px solid #ede9fe}
  .kpi-val{font-size:28px;font-weight:900;margin-bottom:4px}
  .kpi-lbl{font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .two-col{display:flex;gap:24px;margin-bottom:22px}
  .col{flex:1}
  .table{width:100%;border-collapse:collapse;font-size:12px}
  .table th{background:#f8f7ff;color:#6C47FF;font-weight:700;font-size:10px;padding:8px 12px;text-align:left;border-bottom:2px solid #ede9fe}
  .table td{padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151}
  .table tr:last-child td{border-bottom:none}
  .prog-row{margin-bottom:10px}
  .prog-header{display:flex;justify-content:space-between;margin-bottom:4px}
  .prog-label{font-size:11px;font-weight:600;color:#374151}
  .prog-val{font-size:11px;font-weight:700}
  .prog-bar{height:7px;background:#f0f0f7;border-radius:4px;overflow:hidden}
  .prog-fill{height:7px;border-radius:4px}
  .badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700}
  .badge-done{background:#dcfce7;color:#16a34a}
  .badge-pending{background:#fef9c3;color:#d97706}
  .badge-total{background:#f0f0f7;color:#6b7280}
  .info-box{border-radius:10px;padding:14px 16px;margin-bottom:10px;border-left:4px solid}
  .info-box.purple{background:#f5f3ff;border-color:#6C47FF}
  .info-box.blue{background:#eff6ff;border-color:#2563eb}
  .info-box.red{background:#fef2f2;border-color:#ef4444}
  .info-box.green{background:#f0fdf4;border-color:#16a34a}
  .info-box-title{font-size:11px;font-weight:700;margin-bottom:5px}
  .info-box.purple .info-box-title{color:#6C47FF}
  .info-box.blue .info-box-title{color:#2563eb}
  .info-box.red .info-box-title{color:#ef4444}
  .info-box.green .info-box-title{color:#16a34a}
  .info-box-body{font-size:12px;color:#374151;line-height:1.6}
  .doc-footer{display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #f0f0f7;margin-top:8px}
  .doc-footer span{font-size:10px;color:#9ca3af}
`;

function buildHtml(d: ReportData): string {
  const now = new Date().toLocaleString('mn-MN');
  const yr = new Date().getFullYear();
  const total = (d.completedTaskCount ?? 0) + (d.pendingTaskCount ?? 0);
  const completion = pct(d.completedTaskCount, total);
  const range = !d.period || d.period === 'day' ? fmt(d.endDate) : `${fmt(d.startDate)} – ${fmt(d.endDate)}`;

  const cover = `<div class="page cover">
    <div class="cover-c1"></div><div class="cover-c2"></div>
    <div>
      <div class="cover-logo"><div class="logo-box"><span class="logo-text">PQ</span></div><span class="logo-name">PINEQUEST</span></div>
      <div class="cover-badge">EXECUTIVE REPORT · CONFIDENTIAL</div>
      <div class="cover-title">Гүйцэтгэлийн<br>Тайлан</div>
      <div class="cover-subtitle">Executive Productivity Report</div>
    </div>
    <div class="cover-mid">
      <div class="cover-meta-row">
        <div class="cover-meta-item"><span class="cover-meta-label">Тайлант хугацаа</span><span class="cover-meta-value">${d.label}</span></div>
        <div class="cover-meta-item"><span class="cover-meta-label">Огноо</span><span class="cover-meta-value">${range}</span></div>
        <div class="cover-meta-item"><span class="cover-meta-label">Гүйцэтгэл</span><span class="cover-meta-value">${completion}%</span></div>
      </div>
    </div>
    <div class="cover-bottom"><span class="cover-conf">CONFIDENTIAL · FOR MANAGEMENT USE ONLY</span><span class="cover-page">Үүсгэсэн: ${now}</span></div>
  </div>`;

  const content = `<div class="page content-page">
    <div class="page-header">
      <div class="page-header-left"><div class="page-header-dot"></div><span class="page-header-title">KPI &amp; ШИНЖИЛГЭЭ</span></div>
      <span class="page-header-right">PineQuest · 2/2</span>
    </div>
    <div class="section">
      ${secTitle('Гол үзүүлэлтүүд (KPI)')}
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-val" style="color:#6C47FF">${total}</div><div class="kpi-lbl">Нийт</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#16a34a">${d.completedTaskCount}</div><div class="kpi-lbl">Гүйцэтгэл</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#d97706">${d.pendingTaskCount}</div><div class="kpi-lbl">Үлдсэн</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#0891b2">${completion}%</div><div class="kpi-lbl">Хувь</div></div>
      </div>
    </div>
    <div class="two-col">
      <div class="col">
        ${secTitle('Ач холбогдлоор')}
        ${progBar('Өндөр', d.highCount ?? 0, total, '#ef4444')}
        ${progBar('Дунд', d.mediumCount ?? 0, total, '#f59e0b')}
        ${progBar('Бага', d.lowCount ?? 0, total, '#6b7280')}
      </div>
      <div class="col">
        ${secTitle('Хүснэгт')}
        <table class="table">
          <thead><tr><th>Төлөв</th><th>Тоо</th><th>%</th></tr></thead>
          <tbody>
            <tr><td><span class="badge badge-done">&#10003; Гүйцэтгэсэн</span></td><td>${d.completedTaskCount}</td><td>${pct(d.completedTaskCount, total)}%</td></tr>
            <tr><td><span class="badge badge-pending">&#9675; Хүлээгдэж буй</span></td><td>${d.pendingTaskCount}</td><td>${pct(d.pendingTaskCount, total)}%</td></tr>
            <tr><td><span class="badge badge-total">&#9642; Бүртгэл</span></td><td>${d.entryCount}</td><td>&#8212;</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="section">
      ${secTitle('AI Шинжилгээ &amp; Зөвлөмж')}
      ${infoBox('purple', 'Товч дүгнэлт — Executive Summary', d.executiveSummary)}
      ${infoBox('blue', 'Шинжилгээ &amp; Хандлага — Insights', d.insights)}
      ${infoBox('red', 'Эрсдэл &amp; Саатал — Risks', d.risks)}
      ${infoBox('green', 'Зөвлөмж — Recommendations', d.recommendations)}
    </div>
    <div class="doc-footer">
      <span>PineQuest Executive Report</span><span>© ${yr} · Нууцлал</span><span>${now}</span>
    </div>
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${cover}${content}</body></html>`;
}

export function exportPdf(data: ReportData) {
  const html = buildHtml(data);
  const win = window.open('', '_blank');
  if (!win) { alert('Popup blocked. Браузерийн popup-ийг зөвшөөрнө үү.'); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}
