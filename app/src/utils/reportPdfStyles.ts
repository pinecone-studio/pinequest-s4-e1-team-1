export const PDF_CSS = `
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; }

  .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; page-break-after: always; }

  /* Cover page */
  .cover { background: linear-gradient(135deg, #5B3FE0 0%, #8B5CF6 60%, #a78bfa 100%); height: 297mm; display: flex; flex-direction: column; justify-content: space-between; padding: 50px 48px; position: relative; overflow: hidden; }
  .cover-circle1 { position: absolute; right: -60px; top: -60px; width: 280px; height: 280px; border-radius: 50%; background: rgba(255,255,255,0.07); }
  .cover-circle2 { position: absolute; left: -40px; bottom: 80px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .cover-circle3 { position: absolute; right: 60px; bottom: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.06); }
  .cover-top { z-index: 1; }
  .cover-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 60px; }
  .logo-box { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .logo-text { font-size: 20px; font-weight: 900; color: #fff; }
  .logo-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: 1px; }
  .cover-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 2px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
  .cover-title { font-size: 36px; font-weight: 900; color: #fff; line-height: 1.2; margin-bottom: 12px; }
  .cover-subtitle { font-size: 15px; color: rgba(255,255,255,0.75); font-weight: 500; }
  .cover-mid { z-index: 1; background: rgba(255,255,255,0.12); border-radius: 16px; padding: 28px 32px; }
  .cover-meta-row { display: flex; gap: 40px; }
  .cover-meta-item { display: flex; flex-direction: column; gap: 4px; }
  .cover-meta-label { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
  .cover-meta-value { font-size: 15px; color: #fff; font-weight: 700; }
  .cover-bottom { z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; }
  .cover-conf { font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1px; }
  .cover-page { font-size: 11px; color: rgba(255,255,255,0.5); }

  /* Content pages */
  .content-page { padding: 40px 48px 60px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #f0f0f7; margin-bottom: 32px; }
  .page-header-left { display: flex; align-items: center; gap: 10px; }
  .page-header-dot { width: 8px; height: 8px; border-radius: 50%; background: #6C47FF; }
  .page-header-title { font-size: 13px; font-weight: 700; color: #6C47FF; letter-spacing: 0.5px; }
  .page-header-right { font-size: 11px; color: #9ca3af; }
  .page-footer { position: absolute; bottom: 24px; left: 48px; right: 48px; display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f0f0f7; }
  .page-footer-txt { font-size: 10px; color: #9ca3af; }

  /* Section */
  .section { margin-bottom: 32px; }
  .section-title { font-size: 11px; font-weight: 800; color: #6C47FF; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  .section-body { font-size: 13.5px; color: #374151; line-height: 1.75; }

  /* KPI grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi-card { background: #f8f7ff; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #ede9fe; }
  .kpi-val { font-size: 32px; font-weight: 900; margin-bottom: 4px; }
  .kpi-lbl { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Priority table */
  .table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .table th { background: #f8f7ff; color: #6C47FF; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 2px solid #ede9fe; }
  .table td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
  .table tr:last-child td { border-bottom: none; }

  /* Progress bar */
  .prog-row { margin-bottom: 12px; }
  .prog-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .prog-label { font-size: 12px; font-weight: 600; color: #374151; }
  .prog-val { font-size: 12px; font-weight: 700; }
  .prog-bar { height: 8px; background: #f0f0f7; border-radius: 4px; overflow: hidden; }
  .prog-fill { height: 8px; border-radius: 4px; }

  /* Status badges */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .badge-done    { background: #dcfce7; color: #16a34a; }
  .badge-pending { background: #fef9c3; color: #d97706; }
  .badge-total   { background: #f0f0f7; color: #6b7280; }

  /* Info box */
  .info-box { border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; border-left: 4px solid; }
  .info-box.purple { background: #f5f3ff; border-color: #6C47FF; }
  .info-box.blue   { background: #eff6ff; border-color: #2563eb; }
  .info-box.red    { background: #fef2f2; border-color: #ef4444; }
  .info-box.green  { background: #f0fdf4; border-color: #16a34a; }
  .info-box-title  { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
  .info-box.purple .info-box-title { color: #6C47FF; }
  .info-box.blue   .info-box-title { color: #2563eb; }
  .info-box.red    .info-box-title { color: #ef4444; }
  .info-box.green  .info-box-title { color: #16a34a; }
  .info-box-body { font-size: 13px; color: #374151; line-height: 1.7; }

  @media print { .page { page-break-after: always; } }
`;
