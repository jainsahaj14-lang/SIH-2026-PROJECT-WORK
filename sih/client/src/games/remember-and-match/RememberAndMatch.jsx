import React, { useState, useEffect, useRef } from 'react';
import {
  DIFFICULTY_LEVELS,
  generateRoundItems,
  STORAGE_KEYS,
} from './config';
import './RememberAndMatch.css';

export default function RememberAndMatch() {
  const [difficulty, setDifficulty] = useState('easy');
  const [showDiffPicker, setShowDiffPicker] = useState(false);
  const [round, setRound] = useState(1);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Game Phase: 'memorize' | 'recall' | 'result'
  const [phase, setPhase] = useState('memorize');
  const [targets, setTargets] = useState([]);
  const [recallGrid, setRecallGrid] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timerProgress, setTimerProgress] = useState(100);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load best streak for the selected difficulty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStreak = parseInt(
        localStorage.getItem(`${STORAGE_KEYS.STREAK_PREFIX}${difficulty}`) || '0',
        10
      );
      setBestStreak(savedStreak);
    }
  }, [difficulty]);

  // Start new round on mount or difficulty change
  useEffect(() => {
    startNewRound(difficulty, false);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  /**
   * Starts a new round
   */
  const startNewRound = (diffKey = difficulty, isNextRound = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const { targets: newTargets, recallGrid: newGrid, config } = generateRoundItems(diffKey);
    setTargets(newTargets);
    setRecallGrid(newGrid);
    setSelected([]);
    setPhase('memorize');
    setTimerProgress(100);
    setShowDiffPicker(false);

    if (isNextRound) {
      setRound((prev) => prev + 1);
    } else {
      setRound(1);
      setCurrentStreak(0);
    }

    // Start gentle countdown for memorize phase
    const totalMs = config.memorizeSeconds * 1000;
    const intervalMs = 100;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, totalMs - elapsed);
      const percentage = (remaining / totalMs) * 100;
      setTimerProgress(percentage);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setPhase('recall');
      }
    }, intervalMs);
  };

  /**
   * Allow user to advance to recall phase early if ready
   */
  const handleReadyToRecall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('recall');
  };

  /**
   * Handle emoji selection during recall phase
   */
  const handleTileClick = (emoji) => {
    if (phase !== 'recall') return;

    const currentConfig = DIFFICULTY_LEVELS[difficulty];
    const maxSelect = currentConfig.targetsCount;

    if (selected.includes(emoji)) {
      // Deselect
      setSelected((prev) => prev.filter((item) => item !== emoji));
    } else {
      // Select up to target count
      if (selected.length < maxSelect) {
        setSelected((prev) => [...prev, emoji]);
      }
    }
  };

  /**
   * Check player's selections
   */
  const handleSubmitAnswers = () => {
    if (selected.length === 0) return;

    setPhase('result');

    // Calculate score
    const correctCount = selected.filter((item) => targets.includes(item)).length;
    const isPerfect = correctCount === targets.length;

    if (isPerfect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);

      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `${STORAGE_KEYS.STREAK_PREFIX}${difficulty}`,
            String(newStreak)
          );
        }
      }
    } else {
      setCurrentStreak(0);
    }
  };

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    setShowDiffPicker(false);
  };

  const currentConfig = DIFFICULTY_LEVELS[difficulty];
  const correctCount = selected.filter((item) => targets.includes(item)).length;
  const isPerfect = phase === 'result' && correctCount === targets.length;

  return (
    <div className="rm-page-wrapper">
      <div className="rm-game-container">
        {/* Header matching Figma */}
        <header className="rm-header">
          <div className="rm-title-row">
            <span className="rm-lightbulb-icon" role="img" aria-label="Lightbulb">💡</span>
            <h1 className="rm-title">Remember & Match</h1>
          </div>
          <p className="rm-subtitle">
            Watch the pictures, then find them again once they're hidden.
          </p>
        </header>

        {/* Stats Pills Row matching Figma */}
        <div className="rm-pills-row">
          <button
            type="button"
            className="rm-pill rm-pill-difficulty"
            onClick={() => setShowDiffPicker(!showDiffPicker)}
            title="Tap to change difficulty"
            aria-expanded={showDiffPicker}
          >
            <span>difficulty :</span>
            <span className="rm-pill-badge">{currentConfig.label}</span>
          </button>

          <div className="rm-pill">
            <span>Round :</span>
            <span className="rm-pill-value">{round}</span>
          </div>

          <div className="rm-pill">
            <span>Best streak :</span>
            <span className="rm-pill-value">{bestStreak}</span>
          </div>
        </div>

        {/* Difficulty Switcher Popover / Row */}
        {showDiffPicker && (
          <div className="rm-difficulty-selector">
            {Object.values(DIFFICULTY_LEVELS).map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                className={`rm-diff-btn ${difficulty === lvl.id ? 'rm-active' : ''}`}
                onClick={() => handleDifficultyChange(lvl.id)}
              >
                {lvl.label} ({lvl.targetsCount})
              </button>
            ))}
          </div>
        )}

        {/* =========================================================
            PHASE 1: MEMORIZE
            ========================================================= */}
        {phase === 'memorize' && (
          <div className="rm-memorize-container">
            <div className="rm-prompt-section">
              <h2 className="rm-question">Remember these pictures</h2>
              <p className="rm-phase-hint">
                Look closely at all {targets.length} pictures. They will hide soon!
              </p>
            </div>

            {/* Target Emojis in Large Peach Tiles */}
            <div className="rm-memorize-grid">
              {targets.map((emoji, idx) => (
                <div key={idx} className="rm-memorize-tile">
                  {emoji}
                </div>
              ))}
            </div>

            {/* Gentle Progress Bar */}
            <div className="rm-timer-bar-wrap" aria-hidden="true">
              <div
                className="rm-timer-bar-fill"
                style={{ width: `${timerProgress}%` }}
              />
            </div>

            {/* Accessible "I'm Ready" Button */}
            <button
              type="button"
              className="rm-ready-btn"
              onClick={handleReadyToRecall}
            >
              I'm Ready Now ✓
            </button>
          </div>
        )}

        {/* =========================================================
            PHASE 2 & 3: RECALL & RESULT GRIDS
            ========================================================= */}
        {(phase === 'recall' || phase === 'result') && (
          <>
            <div className="rm-prompt-section">
              <h2 className="rm-question">Which pictures did you see ?</h2>
              {phase === 'recall' && (
                <p className="rm-phase-hint">
                  Tap {currentConfig.targetsCount} pictures ({selected.length} of {currentConfig.targetsCount} selected)
                </p>
              )}
            </div>

            {/* Recall Grid (Peach rounded-square tiles) */}
            <div
              className={`rm-grid ${
                currentConfig.columns === 5 ? 'rm-grid-5-cols' : 'rm-grid-4-cols'
              }`}
            >
              {recallGrid.map((emoji, idx) => {
                const isSelected = selected.includes(emoji);
                const isTarget = targets.includes(emoji);

                let tileClass = 'rm-tile';
                let badge = null;

                if (phase === 'recall') {
                  if (isSelected) tileClass += ' rm-selected';
                } else if (phase === 'result') {
                  if (isSelected && isTarget) {
                    tileClass += ' rm-correct';
                    badge = <span className="rm-tile-badge rm-tile-badge-correct">✓</span>;
                  } else if (isSelected && !isTarget) {
                    tileClass += ' rm-incorrect-pick';
                    badge = <span className="rm-tile-badge rm-tile-badge-wrong">✕</span>;
                  } else if (!isSelected && isTarget) {
                    tileClass += ' rm-missed-target';
                  } else {
                    tileClass += ' rm-unselected-distractor';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={tileClass}
                    onClick={() => handleTileClick(emoji)}
                    disabled={phase === 'result'}
                    aria-label={`Picture tile ${emoji}`}
                    aria-pressed={isSelected}
                  >
                    {emoji}
                    {badge}
                  </button>
                );
              })}
            </div>

            {/* Result Feedback Line matching Figma */}
            {phase === 'result' && (
              <div className="rm-feedback-box">
                <p className="rm-feedback-text">
                  {isPerfect
                    ? `Great job! All ${targets.length} remembered correctly.`
                    : correctCount > 0
                    ? `close! ${correctCount} of ${targets.length} remembered correctly.`
                    : `Good effort! Keep going, you're doing great.`}
                </p>
                {currentStreak > 1 && (
                  <span className="rm-feedback-sub">
                    🔥 {currentStreak} round streak!
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {phase === 'recall' ? (
              <button
                type="button"
                className="rm-btn-action rm-btn-submit"
                onClick={handleSubmitAnswers}
                disabled={selected.length === 0}
              >
                {selected.length === currentConfig.targetsCount
                  ? 'Check Answers ✓'
                  : `Check (${selected.length}/${currentConfig.targetsCount})`}
              </button>
            ) : (
              <button
                type="button"
                className="rm-btn-action rm-btn-green"
                onClick={() => startNewRound(difficulty, true)}
              >
                Next Round →
              </button>
            )}
          </>
        )}

        {/* Footer Encouragement Text matching Figma */}
        <footer className="rm-footer-note">
          Take your time. Daily memory practice helps keep your mind bright and active.
        </footer>
      </div>
    </div>
  );
}
