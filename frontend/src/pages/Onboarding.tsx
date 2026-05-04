import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    key: 'investmentObjective',
    question: 'What is your investment objective?',
    options: ['growth', 'income', 'safety']
  },
  {
    key: 'riskAppetite',
    question: 'What is your risk appetite?',
    options: ['conservative', 'balanced', 'aggressive']
  },
  {
    key: 'investmentHorizon',
    question: 'What is your investment horizon?',
    options: ['short-term', 'medium-term', 'long-term']
  },
  {
    key: 'capitalAvailable',
    question: 'How much capital do you have available to invest? (£)',
    type: 'number'
  },
  {
    key: 'income',
    question: 'What is your annual income? (£)',
    type: 'number'
  },
  {
    key: 'existingPortfolio',
    question: 'Describe your existing portfolio (or leave blank if none)',
    type: 'text'
  },
  {
    key: 'ethicalConstraints',
    question: 'Any ethical constraints? (e.g. no tobacco, no weapons — leave blank if none)',
    type: 'text'
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const current = STEPS[step];

  const handleAnswer = (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);
    setInput('');

    if (step + 1 < STEPS.length) {
      setStep(step + 1);
    } else {
      localStorage.setItem('profile', JSON.stringify(updated));
      navigate('/');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.progress}>
          Step {step + 1} of {STEPS.length}
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <h2 style={styles.question}>{current.question}</h2>

        {current.options ? (
          <div style={styles.options}>
            {current.options.map(opt => (
              <button
                key={opt}
                style={styles.optionButton}
                onClick={() => handleAnswer(opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <input
              style={styles.input}
              type={current.type === 'number' ? 'number' : 'text'}
              placeholder="Your answer..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              style={styles.button}
              onClick={() => handleAnswer(input)}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' },
  card: { background: 'white', padding: '2rem', borderRadius: '8px', width: '420px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  progress: { fontSize: '12px', color: '#999', marginBottom: '8px' },
  progressBar: { height: '4px', background: '#eee', borderRadius: '2px', marginBottom: '2rem' },
  progressFill: { height: '100%', background: '#1a1a1a', borderRadius: '2px', transition: 'width 0.3s' },
  question: { fontSize: '18px', fontWeight: 500, marginBottom: '1.5rem', lineHeight: 1.4 },
  options: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionButton: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', fontSize: '14px', cursor: 'pointer', textAlign: 'left' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }
};