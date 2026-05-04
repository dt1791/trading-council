import React, { useState } from 'react';
import { councilAPI } from '../api';

interface PersonaAnalysis {
  personaId: string;
  personaName: string;
  recommendation: string;
  reasoning: string;
  riskFactors: string[];
  positionSize: string;
  confidence: number;
  weight: number;
}

interface Verdict {
  action: string;
  positionSize: string;
  summary: string;
  confidence: number;
  personaContributions: PersonaAnalysis[];
  stock: {
    ticker: string;
    price: number;
    change_pct: string;
    news: { title: string; url: string }[];
  };
}

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');

  const profile = JSON.parse(localStorage.getItem('profile') || '{}');
  const userId = localStorage.getItem('userId') || 'anonymous';

  const handleAnalyse = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError('');
    setVerdict(null);
    try {
      const res = await councilAPI.analyse(userId, ticker, profile);
      setVerdict(res.data);
    } catch (e) {
      setError('Failed to analyse stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recColour = (rec: string) => {
    if (rec === 'buy') return '#16a34a';
    if (rec === 'sell') return '#dc2626';
    return '#d97706';
  };

  const actionColour = (action: string) => {
    if (action === 'buy') return '#16a34a';
    if (action === 'sell') return '#dc2626';
    return '#d97706';
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Trading Council</h1>
          <p style={styles.subtitle}>Your personalised investment panel</p>
        </div>

        {/* Stock Input */}
        <div style={styles.section}>
          <div style={styles.label}>Analyse a stock</div>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="Enter ticker (e.g. AAPL, NVDA)"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
            />
            <button
              style={styles.button}
              onClick={handleAnalyse}
              disabled={loading}
            >
              {loading ? 'Convening...' : 'Convene council'}
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.loadingBox}>
            <p style={styles.loadingText}>
              Your council is deliberating... this may take 20-30 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {verdict && (
          <>
            {/* Stock Info */}
            <div style={styles.stockInfo}>
              <span style={styles.stockTicker}>{verdict.stock.ticker}</span>
              <span style={styles.stockPrice}>${verdict.stock.price.toFixed(2)}</span>
              <span style={styles.stockChange}>{verdict.stock.change_pct}</span>
              {verdict.stock.news.length > 0 && (
                <div style={styles.newsLinks}>
                  {verdict.stock.news.slice(0, 3).map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noreferrer" style={styles.newsLink}>
                      {n.title.length > 50 ? n.title.slice(0, 50) + '...' : n.title}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Persona Cards */}
            <div style={styles.section}>
              <div style={styles.label}>Your council</div>
              <div style={styles.grid}>
                {verdict.personaContributions.map(p => (
                  <div key={p.personaId} style={styles.card}>
                    <div style={styles.cardTop}>
                      <span style={styles.personaName}>{p.personaName}</span>
                      <span style={{
                        ...styles.recPill,
                        background: recColour(p.recommendation) + '20',
                        color: recColour(p.recommendation)
                      }}>
                        {p.recommendation.toUpperCase()}
                      </span>
                    </div>
                    <div style={styles.confidence}>
                      Confidence: {Math.round(p.confidence * 100)}% · Weight: {Math.round(p.weight * 100)}%
                    </div>
                    <p style={styles.reasoning}>{p.reasoning}</p>
                    {p.riskFactors.length > 0 && (
                      <div style={styles.risks}>
                        {p.riskFactors.map((r, i) => (
                          <span key={i} style={styles.riskTag}>⚠ {r}</span>
                        ))}
                      </div>
                    )}
                    <div style={styles.weightBarBg}>
                      <div style={{ ...styles.weightBarFill, width: `${p.weight * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chairman Verdict */}
            <div style={styles.section}>
              <div style={styles.label}>Chairman's verdict</div>
              <div style={styles.verdict}>
                <div style={styles.verdictTop}>
                  <span style={{ ...styles.verdictAction, color: actionColour(verdict.action) }}>
                    {verdict.action.toUpperCase()}
                  </span>
                  <span style={styles.verdictSize}>
                    {verdict.positionSize} position
                  </span>
                </div>
                <p style={styles.verdictSummary}>{verdict.summary}</p>
                <div style={styles.confRow}>
                  <span style={styles.confLabel}>Confidence</span>
                  <div style={styles.confBarBg}>
                    <div style={{ ...styles.confBarFill, width: `${verdict.confidence * 100}%` }} />
                  </div>
                  <span style={styles.confLabel}>{Math.round(verdict.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#f5f5f5', minHeight: '100vh', padding: '2rem 1rem' },
  container: { maxWidth: '720px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '24px', fontWeight: 500, margin: 0 },
  subtitle: { color: '#666', fontSize: '14px', margin: '4px 0 0' },
  section: { marginBottom: '2rem' },
  label: { fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
  inputRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  button: { padding: '10px 20px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: '13px', marginTop: '8px' },
  loadingBox: { background: 'white', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', marginBottom: '2rem' },
  loadingText: { color: '#666', fontSize: '14px' },
  stockInfo: { background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' },
  stockTicker: { fontSize: '18px', fontWeight: 600 },
  stockPrice: { fontSize: '18px', fontWeight: 500 },
  stockChange: { fontSize: '13px', color: '#16a34a' },
  newsLinks: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: '4px' },
  newsLink: { fontSize: '12px', color: '#2563eb', textDecoration: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  card: { background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #eee' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  personaName: { fontSize: '13px', fontWeight: 500 },
  recPill: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' },
  confidence: { fontSize: '11px', color: '#999', marginBottom: '8px' },
  reasoning: { fontSize: '12px', color: '#444', lineHeight: 1.5, marginBottom: '8px' },
  risks: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  riskTag: { fontSize: '11px', color: '#d97706' },
  weightBarBg: { height: '3px', background: '#eee', borderRadius: '2px' },
  weightBarFill: { height: '100%', background: '#2563eb', borderRadius: '2px' },
  verdict: { background: 'white', borderRadius: '8px', padding: '1.25rem', border: '2px solid #e5e7eb' },
  verdictTop: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' },
  verdictAction: { fontSize: '32px', fontWeight: 700 },
  verdictSize: { fontSize: '13px', color: '#666' },
  verdictSummary: { fontSize: '13px', color: '#444', lineHeight: 1.6, marginBottom: '12px' },
  confRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  confLabel: { fontSize: '12px', color: '#666' },
  confBarBg: { flex: 1, height: '4px', background: '#eee', borderRadius: '2px' },
  confBarFill: { height: '100%', background: '#16a34a', borderRadius: '2px' }
};