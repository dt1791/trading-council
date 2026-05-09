import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    key: 'investmentObjective',
    question: 'What is your primary investment objective?',
    options: [
      {
        value: 'growth',
        label: 'Growth',
        tooltip: 'Focuses on capital appreciation over income. Your board will weight advisors who analyse revenue acceleration, market share expansion, TAM, and momentum signals — best suited for investors with a longer runway who can tolerate drawdowns in pursuit of compounding returns.\n\nIf you\'re in your 30s or 40s with stable income, no immediate need for liquidity, and want to build significant long-term wealth, growth is likely your objective.'
      },
      {
        value: 'income',
        label: 'Income',
        tooltip: 'Prioritises predictable cash yield over price appreciation. Your board will favour advisors who scrutinise dividend coverage ratios, payout sustainability, free cash flow generation, and balance sheet conservatism.\n\nIf you\'re approaching or in retirement, rely on your portfolio to supplement your income, or want your investments to pay you regularly regardless of market conditions — income is likely your objective.'
      },
      {
        value: 'safety',
        label: 'Safety',
        tooltip: 'Capital preservation above all else. Your board will be heavily weighted towards risk-conscious advisors who assess downside protection, margin of safety, leverage ratios, and liquidity — even if it means lower upside.\n\nIf you\'ve built significant savings you can\'t afford to lose, are nearing a major financial commitment such as a house purchase or education fees, or have a low tolerance for seeing your portfolio fall in value — safety is likely your objective.'
      }
    ]
  },
  {
    key: 'riskAppetite',
    question: 'How would you describe your risk appetite?',
    options: [
      {
        value: 'conservative',
        label: 'Conservative',
        tooltip: 'You prioritise stability and predictability. Your board will favour lower-volatility opportunities, strong balance sheets, and businesses with proven track records — even if it means sacrificing some upside.\n\nIf you lose sleep when markets fall, have dependants relying on your financial stability, or have a shorter time horizon where you can\'t afford to wait for a recovery — conservative is your appetite.'
      },
      {
        value: 'balanced',
        label: 'Balanced',
        tooltip: 'You accept measured risk in pursuit of solid, consistent returns. Your board will weigh both opportunity and downside discipline equally — looking for quality businesses at reasonable valuations with manageable risk profiles.\n\nIf you have stable income, a medium-term horizon, and can absorb moderate portfolio swings without panic — but wouldn\'t be comfortable with speculative bets — balanced is your appetite.'
      },
      {
        value: 'aggressive',
        label: 'Aggressive',
        tooltip: 'You\'re willing to accept significant short-term volatility in pursuit of outsized long-term returns. Your board will include more growth-oriented and momentum-driven voices, accepting higher drawdown risk for higher potential reward.\n\nIf you have a long investment horizon, don\'t need this capital for 10+ years, have other financial safety nets, and can stomach seeing your portfolio drop 30–40% without selling — aggressive is your appetite.'
      }
    ]
  },
  {
    key: 'investmentHorizon',
    question: 'What is your investment horizon?',
    options: [
      {
        value: 'short-term',
        label: 'Short term (under 1 year)',
        tooltip: 'Your board will prioritise near-term catalysts, technical momentum, and market timing signals. Fundamental long-term value matters less than what\'s likely to move in the next few months.\n\nIf you\'re investing spare cash you\'ll need back within the year, trading around a specific event such as earnings or a product launch, or actively managing a short-term portfolio — this is your horizon.'
      },
      {
        value: 'medium-term',
        label: 'Medium term (1–5 years)',
        tooltip: 'A balanced horizon that allows your board to weigh both near-term signals and longer-term fundamental quality. Enough time to recover from short-term volatility while still being mindful of capital preservation.\n\nIf you\'re saving towards a goal 2–5 years away, building a portfolio you\'ll review and rebalance annually, or want to stay invested through market cycles without being overly reactive — this is your horizon.'
      },
      {
        value: 'long-term',
        label: 'Long term (5+ years)',
        tooltip: 'Your board will favour advisors who focus on durable business quality, competitive moats, and compounding value creation. Short-term price movements matter far less than the strength of the underlying business over time.\n\nIf you\'re investing for retirement, your children\'s future, or any goal that\'s a decade or more away — and can leave capital untouched through market cycles — this is your horizon.'
      }
    ]
  },
  {
    key: 'capitalAvailable',
    question: 'How much capital do you have available to invest?',
    type: 'number',
    placeholder: 'Amount in £',
    explanation: 'This helps your board size positions appropriately — recommending how much of your available capital to allocate to each opportunity. It does not need to be your total net worth, just what you\'re looking to put to work.'
  },
  {
    key: 'income',
    question: 'What is your annual income?',
    type: 'number',
    placeholder: 'Annual income in £',
    explanation: 'Your income gives your board context on your financial resilience — how much risk you can absorb relative to your earnings, and whether you have the capacity to add to positions or recover from losses without financial stress.'
  },
  {
    key: 'existingPortfolio',
    question: 'Do you have an existing portfolio?',
    type: 'text',
    placeholder: 'e.g. 60% equities, 30% bonds, 10% cash — or leave blank if starting fresh',
    explanation: 'Knowing your existing holdings helps your board avoid over-concentration and give advice that fits your overall picture — not just the stock being analysed in isolation.'
  },
  {
    key: 'ethicalConstraints',
    question: 'Do you have any ethical or values-based constraints?',
    type: 'text',
    placeholder: 'e.g. no tobacco, no weapons, no fossil fuels — or leave blank if none',
    explanation: 'If you have values-based boundaries, your board will include an ESG advisor who ensures recommendations align with your principles — flagging any exposure to sectors or practices that conflict with your values.'
  }
];

const ALL_PERSONAS: Record<string, {
  name: string; style: string; lens: string;
  description: string; looks_at: string; example: string; mandatory: boolean;
}> = {
  risk_manager: {
    name: 'Risk Manager', style: 'Howard Marks / Seth Klarman',
    lens: 'Capital preservation, downside protection, margin of safety',
    description: 'Assesses every opportunity through the lens of what could go wrong. Examines balance sheet strength, debt levels, cash runway, and liquidity ratios. Looks at downside scenarios — if the thesis is wrong, how much could you lose?',
    looks_at: 'Debt-to-equity, interest coverage, free cash flow, cash reserves, volatility history',
    example: 'Would flag a highly leveraged company even if its growth story is compelling — "the upside is attractive but the balance sheet cannot survive a recession."',
    mandatory: true
  },
  quant: {
    name: 'Quant / Systematic', style: 'Jim Simons / Cliff Asness',
    lens: 'Data-driven signals, momentum, factor discipline',
    description: 'Ignores narrative entirely. Analyses price momentum, factor scores, and statistical signals to determine whether the data supports the thesis. Applies rules-based discipline to avoid emotional bias.',
    looks_at: '30/60/90-day momentum, relative strength, factor alignment, volatility regime',
    example: 'Would recommend a "boring" stock with no exciting story if the momentum and factor signals are strong — and would exit a compelling narrative stock the moment the data turns negative.',
    mandatory: true
  },
  growth_investor: {
    name: 'Growth Investor', style: 'Peter Lynch / Cathie Wood',
    lens: 'Revenue expansion, innovation, total addressable market',
    description: 'Focuses on companies growing faster than the market with a credible path to significantly larger scale. Willing to pay a premium for compounding growth, but wants evidence the growth is real and sustainable.',
    looks_at: 'Revenue growth rate, gross margin trend, TAM size, market share gains, customer acquisition trajectory',
    example: 'Would back a company with no profits today if revenue is accelerating and unit economics are improving — but would walk away if growth is slowing or cash burn is unsustainable.',
    mandatory: false
  },
  macro_strategist: {
    name: 'Macro Strategist', style: 'Ray Dalio / Paul Tudor Jones',
    lens: 'Economic regime, interest rates, inflation, geopolitics',
    description: 'Evaluates whether the broader macroeconomic environment is favourable for this stock. A stock can have strong fundamentals and still be a bad investment if the macro backdrop is working against it.',
    looks_at: 'Rate cycle, inflation sensitivity, sector cyclicality, currency exposure, geopolitical risk, central bank policy',
    example: 'Would recommend reducing exposure to rate-sensitive growth stocks during a tightening cycle — even if the company itself is excellent — because macro creates a structural headwind to valuation.',
    mandatory: false
  },
  value_investor: {
    name: 'Value Investor', style: 'Warren Buffett',
    lens: 'Intrinsic value, durable competitive advantage, business quality',
    description: 'Looks for businesses trading below their intrinsic value with durable competitive advantages. Focuses on the quality of the economics, not just the price. Patient by nature — willing to wait for the right price on a great business.',
    looks_at: 'P/E, P/FCF, EV/EBITDA vs peers, return on equity, economic moat, capital allocation history',
    example: 'Would pass on a fast-growing company at 50x earnings in favour of a slower-growing but high-quality business at 15x — "far better to buy a wonderful company at a fair price."',
    mandatory: false
  },
  income_investor: {
    name: 'Income / Dividend Investor', style: 'Benjamin Graham / John Bogle',
    lens: 'Cash yield, dividend sustainability, defensive income',
    description: 'Prioritises investments that generate reliable, growing income. Scrutinises whether dividends are covered by genuine free cash flow. Prefers businesses with stable, predictable revenue streams that sustain payouts through economic cycles.',
    looks_at: 'Dividend yield, payout ratio, dividend coverage (FCF/dividend), dividend growth history, earnings stability',
    example: 'Would avoid a high-yield stock if the dividend is funded by debt — "a 7% yield that gets cut is worse than a 3% yield that grows every year."',
    mandatory: false
  },
  esg_investor: {
    name: 'Ethical / ESG Investor', style: 'ESG-focused institutional funds',
    lens: 'Values alignment, governance quality, sustainability practices',
    description: 'Ensures recommendations align with your stated ethical principles. Screens for excluded sectors, evaluates board governance, and flags reputational and regulatory risks that ESG-poor companies face over time.',
    looks_at: 'Sector exclusions, ESG scores, board independence, executive pay, carbon footprint, supply chain practices',
    example: 'Would flag a profitable energy company if it conflicts with your no-fossil-fuels constraint — noting that beyond values alignment, the regulatory trajectory creates long-term financial risk.',
    mandatory: false
  }
};

const PROFILE_LABELS: { key: string; label: string }[] = [
  { key: 'investmentObjective', label: 'Investment objective' },
  { key: 'riskAppetite', label: 'Risk appetite' },
  { key: 'investmentHorizon', label: 'Time horizon' },
  { key: 'capitalAvailable', label: 'Capital to invest' },
  { key: 'income', label: 'Annual income' },
  { key: 'existingPortfolio', label: 'Existing portfolio' },
  { key: 'ethicalConstraints', label: 'Ethical constraints' }
];

function getDefaultPersonaIds(profile: Record<string, any>): string[] {
  const selected = ['risk_manager', 'quant'];
  if (profile.investmentObjective === 'growth') selected.push('growth_investor', 'macro_strategist');
  else if (profile.investmentObjective === 'income') selected.push('income_investor', 'value_investor');
  else if (profile.investmentObjective === 'safety') selected.push('value_investor');
  if (profile.ethicalConstraints && profile.ethicalConstraints.trim()) selected.push('esg_investor');
  return selected;
}

function getRemoveWarning(id: string, profile: Record<string, any>): string {
  const risk = profile.riskAppetite;
  const obj = profile.investmentObjective;
  if (id === 'risk_manager') return `Warning: The Risk Manager is your board's primary downside guardian. Removing them means no advisor will formally assess balance sheet risk, leverage, or margin of safety. ${risk === 'conservative' ? 'Given your conservative risk appetite, this is strongly discouraged.' : 'Proceed with caution.'}`;
  if (id === 'quant') return 'Warning: The Quant advisor provides the only purely data-driven, narrative-free signal on your board. Removing them means momentum and statistical signals will not be assessed.';
  if (id === 'growth_investor') return `The Growth Investor was suggested for your ${obj} objective. Removing them means revenue acceleration and market opportunity will carry less weight in the final verdict.`;
  if (id === 'macro_strategist') return 'Removing the Macro Strategist means the broader economic environment — rates, inflation, geopolitical risk — will not be formally assessed.';
  if (id === 'value_investor') return 'Removing the Value Investor means intrinsic value and margin of safety assessments will be absent. The Risk Manager will still assess downside, but valuation discipline will be weaker.';
  if (id === 'income_investor') return 'Removing the Income Investor means dividend sustainability and yield quality will not be formally assessed.';
  if (id === 'esg_investor') return `Removing the ESG Investor means your ethical constraints will not be formally checked. Exposure to ${profile.ethicalConstraints || 'excluded sectors'} may slip through undetected.`;
  return 'Removing this advisor will reduce the breadth of your board.';
}

function getAddReason(id: string, profile: Record<string, any>): string {
  const obj = profile.investmentObjective;
  const risk = profile.riskAppetite;
  if (id === 'growth_investor') return `Not suggested for your ${obj} objective — this advisor carries high conviction on growth stories which may conflict with your priorities. Their weight in the verdict will be low.`;
  if (id === 'macro_strategist') return `Not suggested for your ${obj} objective — macro analysis is most valuable for growth-oriented portfolios. Adding them broadens your view but may introduce conflicting signals.`;
  if (id === 'value_investor') return `Adding the Value Investor broadens your board with a long-term quality lens. Their conservative approach may conflict with ${risk === 'aggressive' ? 'your aggressive risk appetite' : 'short-term signals'}.`;
  if (id === 'income_investor') return `Not suggested for your ${obj} objective — income analysis focuses on yield and stability. Adds a useful conservative check but may conflict with your priorities.`;
  if (id === 'esg_investor') return 'You didn\'t specify ethical constraints, so this advisor wasn\'t suggested. If you have values-based boundaries, adding them ensures no conflicting exposure slips through.';
  return 'Adding this advisor broadens your board with an additional perspective.';
}

const SageLogoSVG = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
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

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [input, setInput] = useState('');
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState<string | null>(null);
  const navigate = useNavigate();

  const current = STEPS[step];

  const handleOptionSelect = (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);
    setHoveredOption(null);
    if (step + 1 < STEPS.length) {
      setStep(step + 1);
    } else {
      setSelectedPersonaIds(getDefaultPersonaIds(updated));
      setShowSummary(true);
    }
  };

  const handleTextAnswer = () => {
    const updated = { ...answers, [current.key]: input };
    setAnswers(updated);
    setInput('');
    if (step + 1 < STEPS.length) {
      setStep(step + 1);
    } else {
      setSelectedPersonaIds(getDefaultPersonaIds(updated));
      setShowSummary(true);
    }
  };

  const handleConfirm = () => {
    localStorage.setItem('profile', JSON.stringify({ ...answers, boardPersonas: selectedPersonaIds }));
    navigate('/');
  };

  const activeTooltip = current.options
    ? (hoveredOption ? current.options.find(o => o.value === hoveredOption)?.tooltip : current.options[0].tooltip)
    : null;
  const activeLabel = current.options
    ? (hoveredOption ? current.options.find(o => o.value === hoveredOption)?.label : current.options[0].label)
    : null;

  const unselectedPersonas = Object.keys(ALL_PERSONAS).filter(id => !selectedPersonaIds.includes(id));

  const formatValue = (key: string, val: any) => {
    if (!val) return '—';
    if (key === 'capitalAvailable' || key === 'income') return `£${Number(val).toLocaleString()}`;
    return String(val);
  };

  if (showSummary) {
    return (
      <div style={styles.page}>
        <div style={styles.summaryContainer}>
          <div style={styles.logoWrap}>
            <SageLogoSVG />
            <span style={styles.brandName}>SAGE</span>
          </div>

          {/* Profile bar */}
          <p style={styles.sectionHeader}>Your profile at a glance</p>
          <div style={styles.profileBar}>
            {PROFILE_LABELS.map(({ key, label }) => (
              <div key={key} style={styles.profileItem}>
                <div style={styles.profileKey}>{label}</div>
                <div style={styles.profileVal}>{formatValue(key, answers[key])}</div>
              </div>
            ))}
          </div>

          {/* Board header */}
          <div style={styles.boardHeader}>
            <span style={styles.boardTitle}>Meet your board</span>
            <span style={styles.boardSub}>We've selected these advisors based on your answers. Each brings a distinct lens to every analysis — together, they form your personal investment board. You can customise the composition below, but read the implications carefully before making any changes.</span>
          </div>

          {/* Persona grid */}
          <div style={styles.grid}>
            {selectedPersonaIds.map(id => {
              const p = ALL_PERSONAS[id];
              const isRemoving = pendingRemove === id;
              return (
                <div key={id} style={styles.tile}>
                  <div style={styles.tileTop}>
                    <div>
                      <span style={styles.tileName}>{p.name}</span>
                      <div style={styles.tileStyle}>{p.style}</div>
                    </div>
                    <div style={styles.tileActions}>
                      {p.mandatory
                        ? <span style={styles.mandatoryBadge}>Always present</span>
                        : <button style={styles.removeBtn} onClick={() => setPendingRemove(isRemoving ? null : id)}>
                            {isRemoving ? 'Cancel' : 'Remove'}
                          </button>
                      }
                    </div>
                  </div>
                  <div style={styles.tileLens}>{p.lens}</div>
                  <div style={styles.tileDesc}>{p.description}</div>
                  <div style={styles.tileMeta}>
                    <span style={styles.tileMetaLabel}>Looks at: </span>
                    <span style={styles.tileMetaText}>{p.looks_at}</span>
                  </div>
                  <div style={styles.tileExample}>"{p.example}"</div>

                  {isRemoving && (
                    <div style={styles.warningBox}>
                      <p style={styles.warningText}>{getRemoveWarning(id, answers)}</p>
                      <div style={styles.warningBtns}>
                        <button style={styles.warningConfirm} onClick={() => {
                          setSelectedPersonaIds(prev => prev.filter(i => i !== id));
                          setPendingRemove(null);
                        }}>Remove anyway</button>
                        <button style={styles.warningCancel} onClick={() => setPendingRemove(null)}>Keep them</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add persona tiles */}
            {unselectedPersonas.map(id => {
              const p = ALL_PERSONAS[id];
              const isAdding = pendingAdd === id;
              return (
                <div key={id} style={{ ...styles.tile, ...styles.tileAdd }}>
                  <div style={styles.tileName}>{p.name}</div>
                  <div style={styles.tileStyle}>{p.style}</div>
                  <div style={styles.tileLens}>{p.lens}</div>
                  {isAdding ? (
                    <div style={styles.warningBox}>
                      <p style={styles.warningText}>{getAddReason(id, answers)}</p>
                      <div style={styles.warningBtns}>
                        <button style={styles.warningConfirm} onClick={() => {
                          setSelectedPersonaIds(prev => [...prev, id]);
                          setPendingAdd(null);
                        }}>Add to board</button>
                        <button style={styles.warningCancel} onClick={() => setPendingAdd(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button style={styles.addBtn} onClick={() => setPendingAdd(id)}>+ Add to board</button>
                  )}
                </div>
              );
            })}
          </div>

          <button style={styles.confirmButton} onClick={handleConfirm}>Enter Sage →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <div style={styles.card}>
          <div style={styles.logoWrap}>
            <SageLogoSVG />
            <span style={styles.brandName}>SAGE</span>
          </div>
          <div style={styles.progressLabel}>Step {step + 1} of {STEPS.length}</div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <h2 style={styles.question}>{current.question}</h2>
          {current.options ? (
            <div style={styles.options}>
              {current.options.map(opt => (
                <button
                  key={opt.value}
                  style={{
                    ...styles.optionButton,
                    ...(hoveredOption === opt.value ? styles.optionButtonHovered : {}),
                    ...(!hoveredOption && opt.value === current.options![0].value ? styles.optionButtonHovered : {})
                  }}
                  onMouseEnter={() => setHoveredOption(opt.value)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => handleOptionSelect(opt.value)}
                >
                  {opt.label}
                  <span style={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {current.explanation && <p style={styles.fieldExplanation}>{current.explanation}</p>}
              <input
                style={styles.input}
                type={current.type === 'number' ? 'number' : 'text'}
                placeholder={current.placeholder}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextAnswer()}
              />
              <button style={styles.button} onClick={handleTextAnswer}>Continue →</button>
            </div>
          )}
        </div>

        {current.options && (
          <div style={styles.tooltipPanel}>
            <p style={styles.tooltipHeader}>Each choice shapes your personal board of advisors</p>
            <div style={styles.divider} />
            {activeLabel && <p style={styles.tooltipLabel}>{activeLabel}</p>}
            {activeTooltip && (
              <div style={styles.tooltipContent}>
                {activeTooltip.split('\n\n').map((para, i) => (
                  <p key={i} style={i === 0 ? styles.tooltipMain : styles.tooltipExample}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#f0ede6', fontFamily: 'system-ui, sans-serif', padding: '2rem' },
  layout: { display: 'flex', gap: '2rem', maxWidth: '920px', width: '100%', alignItems: 'flex-start' },
  summaryContainer: { width: '100%', maxWidth: '1100px' },
  card: { background: 'white', padding: '2.5rem', borderRadius: '12px', width: '400px', flexShrink: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' },
  brandName: { fontSize: '20px', fontWeight: 400, color: '#2d3d2e', letterSpacing: '0.2em', fontFamily: 'Georgia, serif' },
  progressLabel: { fontSize: '12px', color: '#999', marginBottom: '8px' },
  progressBar: { height: '3px', background: '#eee', borderRadius: '2px', marginBottom: '2rem' },
  progressFill: { height: '100%', background: '#2d3d2e', borderRadius: '2px', transition: 'width 0.3s' },
  question: { fontSize: '20px', fontWeight: 400, color: '#1a2a1b', marginBottom: '1.5rem', lineHeight: 1.4, fontFamily: 'Georgia, serif' },
  options: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionButton: { padding: '14px 16px', border: '0.5px solid #c8d4c9', borderRadius: '8px', background: 'white', fontSize: '14px', cursor: 'pointer', textAlign: 'left', color: '#1a2a1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' },
  optionButtonHovered: { background: '#f0ede6', borderColor: '#2d3d2e' },
  optionArrow: { color: '#8fad7c', fontSize: '16px' },
  fieldExplanation: { fontSize: '13px', color: '#7a8a7b', lineHeight: 1.6, marginBottom: '1rem', padding: '12px', background: '#f0ede6', borderRadius: '6px', borderLeft: '3px solid #8fad7c' },
  input: { width: '100%', padding: '11px 14px', marginBottom: '12px', border: '0.5px solid #c8d4c9', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: '#1a2a1b' },
  button: { width: '100%', padding: '12px', background: '#2d3d2e', color: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  tooltipPanel: { flex: 1, background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  tooltipHeader: { fontSize: '12px', fontWeight: 500, color: '#8fad7c', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem' },
  divider: { height: '0.5px', background: '#eee', marginBottom: '1.25rem' },
  tooltipLabel: { fontSize: '16px', fontWeight: 500, color: '#1a2a1b', marginBottom: '1rem', fontFamily: 'Georgia, serif' },
  tooltipContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  tooltipMain: { fontSize: '14px', color: '#1a2a1b', lineHeight: 1.7, margin: 0 },
  tooltipExample: { fontSize: '13px', color: '#4a6b3a', lineHeight: 1.7, margin: 0, padding: '12px', background: '#f0ede6', borderRadius: '6px', borderLeft: '3px solid #8fad7c' },
  sectionHeader: { fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' },
  profileBar: { background: '#2d3d2e', borderRadius: '12px', padding: '14px 20px', display: 'flex', marginBottom: '2rem' },
  profileItem: { flex: 1, borderRight: '0.5px solid rgba(255,255,255,0.1)', padding: '0 16px' },
  profileKey: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' },
  profileVal: { fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  boardHeader: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', width: '100%'},
  boardTitle: { fontSize: '18px', fontWeight: 400, color: '#1a2a1b', fontFamily: 'Georgia, serif' },
  boardSub: { fontSize: '13px', color: '#7a8a7b', lineHeight: 1.6,  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' },
  tile: { background: 'white', border: '0.5px solid #e8e4db', borderRadius: '12px', padding: '1.25rem' },
  tileAdd: { background: '#f8f7f4', display: 'flex', flexDirection: 'column', gap: '6px' },
  tileTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  tileName: { fontSize: '13px', fontWeight: 600, color: '#1a2a1b', marginBottom: '2px' },
  tileStyle: { fontSize: '11px', color: '#999' },
  tileActions: { flexShrink: 0, marginLeft: '8px' },
  mandatoryBadge: { fontSize: '10px', color: '#4a6b3a', background: '#f0f7ec', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, whiteSpace: 'nowrap' },
  removeBtn: { fontSize: '11px', color: '#dc2626', background: 'none', border: '0.5px solid #fca5a5', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' },
  tileLens: { fontSize: '12px', color: '#4a6b3a', fontWeight: 500, marginBottom: '6px' },
  tileDesc: { fontSize: '12px', color: '#4a5a4b', lineHeight: 1.6, marginBottom: '8px' },
  tileMeta: { fontSize: '12px', marginBottom: '8px' },
  tileMetaLabel: { color: '#999', fontWeight: 500 },
  tileMetaText: { color: '#7a8a7b' },
  tileExample: { fontSize: '12px', color: '#2d3d2e', fontStyle: 'italic', background: '#f0ede6', borderLeft: '3px solid #8fad7c', borderRadius: '4px', padding: '8px 10px', lineHeight: 1.5 },
  warningBox: { marginTop: '10px', background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: '8px', padding: '10px' },
  warningText: { fontSize: '12px', color: '#92400e', lineHeight: 1.6, marginBottom: '10px' },
  warningBtns: { display: 'flex', gap: '6px' },
  warningConfirm: { padding: '5px 12px', background: '#2d3d2e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  warningCancel: { padding: '5px 12px', background: 'white', color: '#2d3d2e', border: '0.5px solid #c8d4c9', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  addBtn: { marginTop: '8px', padding: '8px', background: 'white', border: '0.5px solid #c8d4c9', borderRadius: '6px', fontSize: '12px', color: '#2d3d2e', cursor: 'pointer', width: '100%' },
  confirmButton: { width: '100%', padding: '14px', background: '#2d3d2e', color: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }
};
