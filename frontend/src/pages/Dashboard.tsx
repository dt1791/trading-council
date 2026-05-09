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

const SageLogoSVG = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="8" fill="#c9a84c" opacity="0.08"/>
    <circle cx="20" cy="20" r="5" fill="#c9a84c" opacity="0.15"/>
    <circle cx="20" cy="20" r="2.5" fill="#e8c85a"/>
    <circle cx="20" cy="4" r="1.5" fill="#c9a84c"/>
    <circle cx="20" cy="36" r="1.5" fill="#c9a84c"/>
    <circle cx="4" cy="20" r="1.5" fill="#c9a84c"/>
    <circle cx="36" cy="20" r="1.5" fill="#c9a84c"/>
    <circle cx="8" cy="8" r="1.5" fill="#c9a84c"/>
    <circle cx="32" cy="32" r="1.5" fill="#c9a84c"/>
    <circle cx="32" cy="8" r="1.5" fill="#c9a84c"/>
    <circle cx="8" cy="32" r="1.5" fill="#c9a84c"/>
    <line x1="20" y1="20" x2="20" y2="4" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="20" y2="36" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="4" y2="20" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="36" y2="20" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="8" y2="8" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="32" y2="32" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="32" y2="8" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
    <line x1="20" y1="20" x2="8" y2="32" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
  </svg>
);

function getActionLabel(action: string, holdingStatus: string): string {
  if (action === 'buy') {
    if (holdingStatus === 'adding') return 'ADD TO POSITION';
    return 'BUY';
  }
  if (action === 'sell') {
    if (holdingStatus === 'exiting') return 'EXIT — CONDITIONS SUPPORT YOUR DECISION';
    if (holdingStatus === 'adding') return 'HOLD — DO NOT ADD';
    return 'AVOID';
  }
  if (action === 'hold') {
    if (holdingStatus === 'exiting') return 'HOLD — WAIT FOR BETTER EXIT CONDITIONS';
    if (holdingStatus === 'adding') return 'HOLD — NOT YET THE RIGHT TIME TO ADD';
    return 'WAIT — CONDITIONS NOT YET RIGHT';
  }
  return action.toUpperCase();
}

function getActionExplanation(action: string, holdingStatus: string, ticker: string, sharesHeld: string, price: number): string {
  const shares = parseFloat(sharesHeld);
  const positionValue = shares && price ? `£${Math.round(shares * price).toLocaleString()}` : null;

  if (holdingStatus === 'no') {
    if (action === 'buy') return `The board sees a compelling case to initiate a position in ${ticker}. Review position size guidance and confidence level before acting.`;
    if (action === 'sell') return `The board does not see a case for initiating a position in ${ticker} at current levels. Avoid until conditions improve.`;
    return `The board is not yet convinced enough to recommend initiating a position in ${ticker}. Wait for a stronger signal before committing capital.`;
  }

  if (holdingStatus === 'adding') {
    const positionContext = positionValue ? ` Your current holding is worth approximately ${positionValue}.` : '';
    if (action === 'buy') return `The board supports adding to your ${ticker} position.${positionContext} Review position size guidance below before acting.`;
    if (action === 'sell') return `The board does not support adding to ${ticker} at this time.${positionContext} Hold your current position but do not increase exposure.`;
    return `The board sees no clear catalyst to add to ${ticker} right now.${positionContext} Hold and reconvene when conditions change.`;
  }

  if (holdingStatus === 'exiting') {
    const positionContext = positionValue ? ` Your ${shares} shares are currently worth approximately ${positionValue}.` : '';
    if (action === 'sell') return `The board's analysis supports your intention to exit ${ticker}.${positionContext} Current conditions favour reducing or closing your position.`;
    if (action === 'buy') return `The board actually sees upside in ${ticker} at current levels.${positionContext} You may want to reconsider your exit — or at minimum, wait for a more favourable exit price.`;
    return `The board is neutral on ${ticker} right now.${positionContext} If your reasons for exiting are personal or portfolio-related rather than conviction-based, the board does not see a strong reason to rush the exit.`;
  }

  return '';
}

function getMissingDataNotes(profile: Record<string, any>, holdingStatus: string, sharesHeld: string): string[] {
  const notes: string[] = [];
  if (!profile.capitalAvailable || profile.capitalAvailable === '0') {
    notes.push('Capital available was not provided. Position sizing is indicative only — update your profile for personalised allocation guidance.');
  }
  if (!profile.income || profile.income === '0') {
    notes.push('Annual income was not provided. The board cannot assess your financial resilience without this information.');
  }
  if (holdingStatus === 'no' && (!profile.existingPortfolio || !profile.existingPortfolio.trim())) {
    notes.push('No existing portfolio was provided and you\'ve indicated you don\'t currently hold this stock. The board assumes this would be a new position — concentration risk from other holdings has not been considered.');
  }
  return notes;
}

function getPositionSizeAmount(positionSize: string, profile: Record<string, any>): string {
  const capital = parseFloat(profile.capitalAvailable);
  const hasCapital = capital && capital > 0;

  if (!hasCapital) {
    if (positionSize === 'small') return 'Small position (1–3% of available capital) — provide your capital figure for an exact amount';
    if (positionSize === 'medium') return 'Medium position (3–7% of available capital) — provide your capital figure for an exact amount';
    if (positionSize === 'large') return 'Large position (7–15% of available capital) — provide your capital figure for an exact amount';
    return positionSize;
  }

  if (positionSize === 'small') {
    const low = Math.round(capital * 0.01);
    const high = Math.round(capital * 0.03);
    return `Small position — £${low.toLocaleString()} to £${high.toLocaleString()} (1–3% of your capital)`;
  }
  if (positionSize === 'medium') {
    const low = Math.round(capital * 0.03);
    const high = Math.round(capital * 0.07);
    return `Medium position — £${low.toLocaleString()} to £${high.toLocaleString()} (3–7% of your capital)`;
  }
  if (positionSize === 'large') {
    const low = Math.round(capital * 0.07);
    const high = Math.round(capital * 0.15);
    return `Large position — £${low.toLocaleString()} to £${high.toLocaleString()} (7–15% of your capital)`;
  }
  return positionSize;
}

export default function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [tickerConfirmed, setTickerConfirmed] = useState('');
  const [holdingStatus, setHoldingStatus] = useState('');
  const [sharesHeld, setSharesHeld] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');

  const profile = JSON.parse(localStorage.getItem('profile') || '{}');
  const userId = localStorage.getItem('userId') || 'anonymous';
  const hasPortfolio = profile.existingPortfolio && profile.existingPortfolio.trim();
  const missingNotes = verdict ? getMissingDataNotes(profile, holdingStatus, sharesHeld) : [];

  const handleTickerConfirm = () => {
    if (!ticker.trim()) return;
    setTickerConfirmed(ticker.trim().toUpperCase());
    setHoldingStatus('');
    setSharesHeld('');
    setVerdict(null);
    setError('');
  };

  const handleAnalyse = async () => {
    if (!holdingStatus) { setError('Please tell your board about your position before convening.'); return; }
    if ((holdingStatus === 'adding' || holdingStatus === 'exiting') && !sharesHeld) {
      setError('Please tell us how many shares you hold.'); return;
    }
    setLoading(true);
    setError('');
    setVerdict(null);
    try {
      const enrichedProfile = {
        ...profile,
        holdingStatus,
        sharesHeld: sharesHeld || '0'
      };
      const res = await councilAPI.analyse(userId, tickerConfirmed, enrichedProfile);
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

      {/* Permanent header */}
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <SageLogoSVG />
          <span style={styles.brandName}>SAGE</span>
        </div>
      </div>

      <div style={styles.container}>

        {/* Ticker input */}
        <div style={styles.section}>
          <div style={styles.label}>Analyse a stock</div>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="Enter ticker (e.g. AAPL, NVDA)"
              value={ticker}
              onChange={e => { setTicker(e.target.value.toUpperCase()); setTickerConfirmed(''); }}
              onKeyDown={e => e.key === 'Enter' && handleTickerConfirm()}
            />
            <button style={styles.tickerBtn} onClick={handleTickerConfirm}>
              Continue →
            </button>
          </div>
        </div>

        {/* Position context — appears after ticker confirmed */}
        {tickerConfirmed && (
          <div style={styles.positionSection}>
            <p style={styles.positionPrompt}>
              Before your board convenes on <strong>{tickerConfirmed}</strong>, help them understand your position.
            </p>
            {!hasPortfolio && (
              <p style={styles.positionNote}>
                You didn't share your portfolio during onboarding — your board doesn't know whether you currently hold {tickerConfirmed}. Please select below so they can tailor their advice.
              </p>
       )}

            <div style={styles.holdingOptions}>
              {[
                { value: 'no', label: 'No — I\'m considering buying' },
                { value: 'adding', label: 'Yes — I own shares and considering adding more' },
                { value: 'exiting', label: 'Yes — I\'m looking to exit' }
              ].map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.holdingOption,
                    ...(holdingStatus === opt.value ? styles.holdingOptionActive : {})
                  }}
                  onClick={() => { setHoldingStatus(opt.value); setSharesHeld(''); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Shares input */}
            {(holdingStatus === 'adding' || holdingStatus === 'exiting') && (
              <div style={styles.sharesRow}>
                <label style={styles.sharesLabel}>
                  How many shares of {tickerConfirmed} do you currently hold?
                </label>
                <input
                  style={styles.sharesInput}
                  type="number"
                  placeholder="Number of shares"
                  value={sharesHeld}
                  onChange={e => setSharesHeld(e.target.value)}
                />
              </div>
            )}

            {holdingStatus && (
              <button
                style={styles.conveneBtn}
                onClick={handleAnalyse}
                disabled={loading}
              >
                {loading ? 'Your board is deliberating...' : `Convene board on ${tickerConfirmed} →`}
              </button>
            )}

            {error && <p style={styles.error}>{error}</p>}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={styles.loadingBox}>
            <p style={styles.loadingText}>Your board is deliberating on {tickerConfirmed}... this may take 20–30 seconds.</p>
          </div>
        )}

        {/* Results */}
        {verdict && (
          <>
            {/* Stock Info */}
            <div style={styles.stockInfo}>
              <span style={styles.stockTicker}>{verdict.stock.ticker}</span>
              <span style={styles.stockPrice}>${verdict.stock.price.toFixed(2)}</span>
              <span style={{
                ...styles.stockChange,
                color: verdict.stock.change_pct.startsWith('-') ? '#dc2626' : '#16a34a'
              }}>{verdict.stock.change_pct}</span>
            </div>

            {/* News */}
            {verdict.stock.news.length > 0 && (
              <div style={styles.section}>
                <div style={styles.label}>In the news</div>
                <div style={styles.newsList}>
                  {verdict.stock.news.slice(0, 5).map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noreferrer" style={styles.newsItem}>
                      <span style={styles.newsArrow}>↗</span>
                      <span>{n.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Persona Cards */}
            <div style={styles.section}>
              <div style={styles.label}>Your board's analysis</div>
              <div style={styles.grid}>
                {verdict.personaContributions.map(p => (
                  <div key={p.personaId} style={styles.card}>
                    <div style={styles.cardTop}>
                      <span style={styles.personaName}>{p.personaName}</span>
                      <span style={{
                        ...styles.recPill,
                        background: recColour(p.recommendation) + '18',
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

                {/* Missing data notes */}
                {missingNotes.length > 0 && (
                  <div style={styles.assumptionsBox}>
                    <p style={styles.assumptionsTitle}>⚠ Assumptions made due to incomplete profile</p>
                    {missingNotes.map((note, i) => (
                      <p key={i} style={styles.assumptionNote}>· {note}</p>
                    ))}
                  </div>
                )}

                {/* Action */}
                <div style={styles.verdictTop}>
                  <span style={{ ...styles.verdictAction, color: actionColour(verdict.action) }}>
                    {getActionLabel(verdict.action, holdingStatus)}
                  </span>
                </div>

                {/* Action explanation */}
                <p style={styles.actionExplanation}>
                  {getActionExplanation(verdict.action, holdingStatus, verdict.stock.ticker, sharesHeld, verdict.stock.price)}
                </p>

                {/* Position size */}
                <div style={styles.positionSizeRow}>
                  <span style={styles.positionSizeLabel}>Position guidance</span>
                  <span style={styles.positionSizeValue}>
                    {getPositionSizeAmount(verdict.positionSize, profile)}
                  </span>
                </div>

                {/* Chairman rationale */}
                <div style={styles.rationaleBox}>
                  <p style={styles.rationaleLabel}>Chairman's rationale</p>
                  <p style={styles.verdictSummary}>{verdict.summary}</p>
                </div>

                {/* Confidence */}
                <div style={styles.confRow}>
                  <span style={styles.confLabel}>Board confidence</span>
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
  page: { background: '#f0ede6', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  header: { background: 'white', borderBottom: '0.5px solid #e8e4db', padding: '1rem 2rem', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandName: { fontSize: '22px', fontWeight: 400, color: '#2d3d2e', letterSpacing: '0.2em', fontFamily: 'Georgia, serif' },
  container: { maxWidth: '960px', margin: '0 auto', padding: '2rem 3rem' },
  section: { marginBottom: '2rem' },
  label: { fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' },
  inputRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '11px 14px', border: '0.5px solid #c8d4c9', borderRadius: '8px', fontSize: '14px', background: 'white', color: '#1a2a1b' },
  tickerBtn: { padding: '11px 20px', background: '#2d3d2e', color: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  positionSection: { background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '0.5px solid #e8e4db' },
  positionPrompt: { fontSize: '15px', color: '#1a2a1b', lineHeight: 1.5, marginBottom: '8px', fontFamily: 'Georgia, serif' },
  positionNote: { fontSize: '12px', color: '#7a8a7b', lineHeight: 1.6, marginBottom: '1rem', padding: '8px 12px', background: '#f8f7f4', borderRadius: '6px', borderLeft: '3px solid #c8d4c9' },
  holdingOptions: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' },
  holdingOption: { padding: '12px 16px', border: '0.5px solid #c8d4c9', borderRadius: '8px', background: 'white', fontSize: '14px', color: '#4a5a4b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  holdingOptionActive: { background: '#2d3d2e', color: 'white', borderColor: '#2d3d2e' },
  sharesRow: { marginBottom: '1rem', padding: '1rem', background: '#f8f7f4', borderRadius: '8px' },
  sharesLabel: { display: 'block', fontSize: '13px', color: '#4a5a4b', fontWeight: 500, marginBottom: '8px' },
  sharesInput: { padding: '9px 12px', border: '0.5px solid #c8d4c9', borderRadius: '8px', fontSize: '14px', width: '200px', color: '#1a2a1b' },
  conveneBtn: { width: '100%', padding: '13px', background: '#2d3d2e', color: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
  error: { color: '#dc2626', fontSize: '13px', marginTop: '8px' },
  loadingBox: { background: 'white', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', marginBottom: '2rem', border: '0.5px solid #e8e4db' },
  loadingText: { color: '#7a8a7b', fontSize: '14px' },
  stockInfo: { background: 'white', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '16px', alignItems: 'center', border: '0.5px solid #e8e4db' },
  stockTicker: { fontSize: '20px', fontWeight: 600, color: '#1a2a1b' },
  stockPrice: { fontSize: '20px', fontWeight: 500, color: '#1a2a1b' },
  stockChange: { fontSize: '14px', fontWeight: 500 },
  newsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  newsItem: { display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: '#2d3d2e', textDecoration: 'none', padding: '10px 14px', background: 'white', borderRadius: '8px', border: '0.5px solid #e8e4db', lineHeight: 1.5 },
  newsArrow: { color: '#8fad7c', flexShrink: 0, fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' },
  card: { background: 'white', borderRadius: '8px', padding: '1.25rem', border: '0.5px solid #e8e4db' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  personaName: { fontSize: '13px', fontWeight: 600, color: '#1a2a1b' },
  recPill: { fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' },
  confidence: { fontSize: '11px', color: '#999', marginBottom: '8px' },
  reasoning: { fontSize: '13px', color: '#4a5a4b', lineHeight: 1.6, marginBottom: '8px' },
  risks: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  riskTag: { fontSize: '11px', color: '#d97706' },
  weightBarBg: { height: '3px', background: '#eee', borderRadius: '2px' },
  weightBarFill: { height: '100%', background: '#2d3d2e', borderRadius: '2px' },
  verdict: { background: 'white', borderRadius: '8px', padding: '1.5rem', border: '0.5px solid #e8e4db' },
  assumptionsBox: { background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' },
  assumptionsTitle: { fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '8px' },
  assumptionNote: { fontSize: '12px', color: '#92400e', lineHeight: 1.6, marginBottom: '4px' },
  verdictTop: { marginBottom: '8px' },
  verdictAction: { fontSize: '28px', fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: '-0.3px' },
  actionExplanation: { fontSize: '14px', color: '#4a5a4b', lineHeight: 1.7, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid #f0ede6' },
  positionSizeRow: { fontSize: '13px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid #f0ede6', display: 'flex', flexDirection: 'column', gap: '4px' },
  positionSizeLabel: { color: '#999', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  positionSizeValue: { color: '#1a2a1b', fontWeight: 500, fontSize: '14px' },
  rationaleBox: { marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid #f0ede6' },
  rationaleLabel: { fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
  verdictSummary: { fontSize: '14px', color: '#4a5a4b', lineHeight: 1.7 },
  confRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  confLabel: { fontSize: '12px', color: '#999', whiteSpace: 'nowrap' },
  confBarBg: { flex: 1, height: '4px', background: '#eee', borderRadius: '2px' },
  confBarFill: { height: '100%', background: '#2d3d2e', borderRadius: '2px' }
};
