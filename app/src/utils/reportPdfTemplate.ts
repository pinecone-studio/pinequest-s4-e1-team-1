import { PDF_CSS } from './reportPdfStyles';

type ReportData = {
  label: string; endDate: string; startDate: string; period: string;
  taskCount: number; completedTaskCount: number; pendingTaskCount: number;
  highCount: number; mediumCount: number; lowCount: number; entryCount: number;
  executiveSummary: string; insights: string; risks: string; recommendations: string;
  userName?: string;
};

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

function infoBox(cls: string, title: string, body: string) {
  if (!body) return '';
  return `<div class="info-box ${cls}"><div class="info-box-title">${title}</div><div class="info-box-body">${body}</div></div>`;
}

function sectionTitle(label: string) {
  return `<div class="section-title">${label}</div>`;
}

export function buildReportHtml(d: ReportData): string {
  const now = new Date().toLocaleString('mn-MN');
  const total = d.completedTaskCount + d.pendingTaskCount;
  const completion = pct(d.completedTaskCount, total);
  const range = d.period === 'day' ? fmt(d.endDate) : `${fmt(d.startDate)} – ${fmt(d.endDate)}`;

  const cover = `<div class="page cover">
    <div class="cover-circle1"></div><div class="cover-circle2"></div><div class="cover-circle3"></div>
    <div class="cover-top">
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
      <div class="page-header-left"><div class="page-header-dot"></div><span class="page-header-title">ГҮЙЦЭТГЭЛ & ШИНЖИЛГЭЭ</span></div>
      <span class="page-header-right">PineQuest · 2/2</span>
    </div>

    <div class="section">
      ${sectionTitle('Гол үзүүлэлтүүд (KPI)')}
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-val" style="color:#6C47FF">${total}</div><div class="kpi-lbl">Нийт</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#16a34a">${d.completedTaskCount}</div><div class="kpi-lbl">Гүйцэтгэл</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#d97706">${d.pendingTaskCount}</div><div class="kpi-lbl">Үлдсэн</div></div>
        <div class="kpi-card"><div class="kpi-val" style="color:#0891b2">${completion}%</div><div class="kpi-lbl">Хувь</div></div>
      </div>
    </div>

    <div class="two-col">
      <div class="col">
        ${sectionTitle('Ач холбогдлоор')}
        ${progBar('Өндөр', d.highCount, total, '#ef4444')}
        ${progBar('Дунд', d.mediumCount, total, '#f59e0b')}
        ${progBar('Бага', d.lowCount, total, '#6b7280')}
      </div>
      <div class="col">
        ${sectionTitle('Хүснэгт')}
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
      ${sectionTitle('AI Шинжилгээ & Зөвлөмж')}
      ${infoBox('purple', 'Товч дүгнэлт — Executive Summary', d.executiveSummary)}
      ${infoBox('blue',   'Шинжилгээ & Хандлага — Insights',  d.insights)}
      ${infoBox('red',    'Эрсдэл & Саатал — Risks',           d.risks)}
      ${infoBox('green',  'Зөвлөмж — Recommendations',         d.recommendations)}
    </div>

    <div class="doc-footer">
      <span>PineQuest Executive Report</span>
      <span>© ${new Date().getFullYear()} · Нууцлал</span>
      <span>${now}</span>
    </div>
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${PDF_CSS}</style></head><body>${cover}${content}</body></html>`;
}
