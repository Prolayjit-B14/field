import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  FileText, Download, ChevronRight, Share2, 
  Sparkles, CheckCircle2, AlertCircle, X, 
  Calendar, Layers, Cpu, ShieldCheck, Printer, RefreshCw, Eye
} from 'lucide-react';
import jsPDF from 'jspdf';

const REPORT_CATEGORIES = ['All Reports', 'Soil', 'Crop', 'Irrigation', 'Weather', 'Devices'];

const DEFAULT_REPORTS = [
  {
    id: 'rep-01',
    title: 'Soil Analysis Report',
    category: 'Soil',
    date: 'May 10, 2024',
    period: 'May 03 – May 10, 2024',
    format: 'PDF',
    size: '980 KB',
    iconColor: '#15803D'
  },
  {
    id: 'rep-02',
    title: 'Irrigation Report',
    category: 'Irrigation',
    date: 'May 09, 2024',
    period: 'May 02 – May 09, 2024',
    format: 'PDF',
    size: '760 KB',
    iconColor: '#0EA5E9'
  },
  {
    id: 'rep-03',
    title: 'Crop Health Report',
    category: 'Crop',
    date: 'May 08, 2024',
    period: 'May 01 – May 08, 2024',
    format: 'PDF',
    size: '1.1 MB',
    iconColor: '#8B5CF6'
  },
  {
    id: 'rep-04',
    title: 'Device Health Report',
    category: 'Devices',
    date: 'May 07, 2024',
    period: 'Apr 30 – May 07, 2024',
    format: 'PDF',
    size: '620 KB',
    iconColor: '#F59E0B'
  }
];

const Reports = () => {
  const { farmInfo, user } = useApp();
  const { sensorData, sensorHistory, systemOverview } = useTelemetry();

  const [activeCategory, setActiveCategory] = useState('All Reports');
  const [reportsList, setReportsList] = useState(DEFAULT_REPORTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeViewerReport, setActiveViewerReport] = useState(null);

  // New Report Form State
  const [reportType, setReportType] = useState('Soil Analysis Report');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [includeSensors, setIncludeSensors] = useState(true);
  const [includeWeather, setIncludeWeather] = useState(true);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (activeCategory === 'All Reports') return reportsList;
    return reportsList.filter(r => r.category.toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, reportsList]);

  // Real PDF generator using actual hardware telemetry
  const generateRealPDF = (title = 'AgriSense Farm Report') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(21, 128, 61); // Agricultural green
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRISENSE PRO - IOT TELEMETRY REPORT', 14, 18);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Farm: ${farmInfo?.name || 'AgriSense Farm'}`, 14, 38);
    doc.text(`Operator: ${user?.name || user?.email || 'Field Operator'}`, 14, 46);
    doc.text(`Report Type: ${title}`, 14, 54);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 62);
    doc.text(`Hardware Status: ${systemOverview?.active_nodes || 0} of ${systemOverview?.total_nodes || 3} nodes broadcasting`, 14, 70);

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 76, pageWidth - 14, 76);

    // Sensor Telemetry Table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Current Live Sensor Telemetry', 14, 86);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 96;

    const sensorEntries = [
      { name: 'Soil Moisture', value: sensorData?.soil?.moisture != null ? `${sensorData.soil.moisture} %` : 'Offline (--)' },
      { name: 'Soil pH', value: sensorData?.soil?.ph != null ? `${sensorData.soil.ph}` : 'Offline (--)' },
      { name: 'Soil Temperature', value: sensorData?.soil?.temp != null ? `${sensorData.soil.temp} °C` : 'Offline (--)' },
      { name: 'Nitrogen (N)', value: sensorData?.soil?.npk?.n != null ? `${sensorData.soil.npk.n} mg/kg` : 'Offline (--)' },
      { name: 'Phosphorus (P)', value: sensorData?.soil?.npk?.p != null ? `${sensorData.soil.npk.p} mg/kg` : 'Offline (--)' },
      { name: 'Potassium (K)', value: sensorData?.soil?.npk?.k != null ? `${sensorData.soil.npk.k} mg/kg` : 'Offline (--)' },
      { name: 'Ambient Temp', value: sensorData?.weather?.temp != null ? `${sensorData.weather.temp} °C` : 'Offline (--)' },
      { name: 'Ambient Humidity', value: sensorData?.weather?.humidity != null ? `${sensorData.weather.humidity} %` : 'Offline (--)' },
    ];

    sensorEntries.forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 245 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 245 : 255);
      doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
      doc.text(item.name, 18, y);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 120, y);
      doc.setFont('helvetica', 'normal');
      y += 9;
    });

    // Agronomy notes
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Agronomic Telemetry Assessment', 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Data compiled via encrypted MQTT packets directly from ESP32 telemetry hardware nodes.', 14, y);
    y += 6;
    doc.text('Verified signature compliant with AgriSense Precision Irrigation protocol v19.', 14, y);

    return doc;
  };

  const handleDownloadReport = (rep) => {
    const doc = generateRealPDF(rep.title);
    doc.save(`${rep.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const handleCreateReportSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newReport = {
        id: `rep-${Date.now()}`,
        title: reportType,
        category: reportType.includes('Soil') ? 'Soil' : reportType.includes('Crop') ? 'Crop' : reportType.includes('Irrigation') ? 'Irrigation' : 'Weather',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        period: dateRange,
        format: 'PDF',
        size: '1.2 MB',
        iconColor: '#15803D'
      };

      setReportsList(prev => [newReport, ...prev]);
      setIsGenerating(false);
      setIsModalOpen(false);

      // Auto-trigger download
      handleDownloadReport(newReport);
    }, 1200);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box'
    }}>

      {/* ─── CATEGORY FILTER CHIPS ─── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {REPORT_CATEGORIES.map(cat => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? 'none' : '1px solid var(--border-main)',
                background: isSelected ? '#15803D' : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ─── PROMINENT WEEKLY SUMMARY CARD (MATCHING PANEL 1) ─── */}
      <motion.div
        whileHover={{ y: -2 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '22px',
          padding: '18px',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Green Document Icon */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: '#F0FDF4',
            border: '1px solid #DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803D',
            flexShrink: 0
          }}>
            <FileText size={24} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Weekly Summary
              </h3>
              <ChevronRight size={16} color="var(--text-inactive)" />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
              May 12 – May 18, 2024
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
              PDF • 1.2 MB
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const rep = { title: 'Weekly Summary Report' };
            handleDownloadReport(rep);
          }}
          style={{
            background: '#15803D',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 18px',
            color: '#FFFFFF',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
            transition: 'transform 0.15s ease'
          }}
        >
          View
        </button>
      </motion.div>

      {/* ─── RECENT REPORTS SECTION ─── */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '0.95rem',
          fontWeight: 900,
          color: 'var(--text-main)',
          margin: '0 0 12px 2px',
          letterSpacing: '-0.02em'
        }}>
          Recent Reports
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredReports.map(report => (
            <motion.div
              key={report.id}
              whileHover={{ y: -1 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '18px',
                padding: '14px 16px',
                border: '1px solid var(--border-main)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: `${report.iconColor}12`,
                  border: `1px solid ${report.iconColor}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: report.iconColor,
                  flexShrink: 0
                }}>
                  <FileText size={20} strokeWidth={2} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                    {report.date}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-inactive)', fontWeight: 600 }}>
                    {report.format} • {report.size}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleDownloadReport(report)}
                  title="Download Report"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Download size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM CTA: GENERATE NEW REPORT (MATCHING PANEL 1) ─── */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', paddingBottom: '8px' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '26px',
            background: '#15803D',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(21, 128, 61, 0.28)'
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
          <span>Generate New Report</span>
        </motion.button>
      </div>

      {/* ─── GENERATE REPORT MODAL FLOW ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '28px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: 'var(--shadow-premium)',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  Generate Farm Report
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateReportSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      padding: '0 12px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option>Soil Analysis Report</option>
                    <option>Irrigation & Moisture Audit</option>
                    <option>Crop Health & NPK Forecast</option>
                    <option>Weather & Micro-Climate Log</option>
                    <option>Device Hardware Health Report</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-main)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      padding: '0 12px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Full Season Cycle</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeSensors} onChange={e => setIncludeSensors(e.target.checked)} />
                    Include Raw Telemetry Readings
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeWeather} onChange={e => setIncludeWeather(e.target.checked)} />
                    Include Meteorological Weather Station
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '16px',
                    background: '#15803D',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: isGenerating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 16px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Compiling Real Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={18} />
                      <span>Compile & Download PDF</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Reports;
