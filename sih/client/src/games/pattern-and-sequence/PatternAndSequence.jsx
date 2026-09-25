import React, { useState, useEffect, useRef } from 'react';
import {
  DIFFICULTY_LEVELS,
  generateRound,
  STORAGE_KEYS,
} from './config';
import './PatternAndSequence.css';

export default function PatternAndSequence() {
  const [difficulty, setDifficulty] = useState('easy');
  const [showDiffPicker, setShowDiffPicker] = useState(false);
  const [round, setRound] = useState(1);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Puzzle State
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);

  // Load best streak on difficulty change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = parseInt(
        localStorage.getItem(`${STORAGE_KEYS.STREAK_PREFIX}${difficulty}`) || '0',
        10
      );
      setBestStreak(saved);
    }
  }, [difficulty]);

  // Start new round on mount or difficulty switch
  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty]);

  const startNewGame = (diffKey = difficulty) => {
    setRound(1);
    setCurrentStreak(0);
    setRecentHistory([]);
    loadNewPuzzle(diffKey, []);
  };

  const loadNewPuzzle = (diffKey, history = recentHistory) => {
    const puzzle = generateRound(diffKey, history);
    setCurrentPuzzle(puzzle);
    setSelectedOptionId(null);
    setIsAnswered(false);

    // Update recent history (keep last 6 items/rules to avoid repetition)
    const updatedHistory = [...(puzzle.usedItems || []), ...history].slice(0, 6);
    setRecentHistory(updatedHistory);
  };

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    setShowDiffPicker(false);
  };

  const handleOptionSelect = (option) => {
    if (isAnswered) return; // prevent changing answer after submission

    setSelectedOptionId(option.id);
    setIsAnswered(true);

    if (option.isCorrect) {
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

  const handleNextRound = () => {
    if (!isAnswered) return;
    setRound((prev) => prev + 1);
    loadNewPuzzle(difficulty, recentHistory);
  };

  const currentConfig = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.easy;
  const chosenOption = currentPuzzle?.options.find((o) => o.id === selectedOptionId);
  const isCorrect = chosenOption?.isCorrect;

  return (
    <div className="ps-page-wrapper">
      <div className="ps-game-container">
        {/* Header matching Figma screenshot */}
        <header className="ps-header">
          <div className="ps-title-row">
            <span className="ps-lightbulb-icon" role="img" aria-label="Lightbulb">💡</span>
            <h1 className="ps-title">Pattern & Sequence</h1>
          </div>
          <p className="ps-subtitle">
            Study the pattern, then choose what comes next.
          </p>
        </header>

        {/* Top Stats Pills Row */}
        <div className="ps-pills-row">
          <button
            type="button"
            className="ps-pill ps-pill-difficulty"
            onClick={() => setShowDiffPicker(!showDiffPicker)}
            title="Tap to change difficulty"
            aria-expanded={showDiffPicker}
          >
            <span>difficulty :</span>
            <span className="ps-pill-badge">{currentConfig.label}</span>
          </button>

          <div className="ps-pill">
            <span>Round :</span>
            <span className="ps-pill-value">{round}</span>
          </div>

          <div className="ps-pill">
            <span>Best streak :</span>
            <span className="ps-pill-value">{bestStreak}</span>
          </div>
        </div>

        {/* Difficulty Selector Dropdown / Row */}
        {showDiffPicker && (
          <div className="ps-difficulty-selector">
            {Object.values(DIFFICULTY_LEVELS).map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                className={`ps-diff-btn ${difficulty === lvl.id ? 'ps-active' : ''}`}
                onClick={() => handleDifficultyChange(lvl.id)}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        )}

        {/* =========================================================
            Pattern Strip (~#F3DEC4 rounded rectangle)
            ========================================================= */}
        {currentPuzzle && (
          <div className="ps-pattern-strip" aria-label="Pattern sequence">
            {currentPuzzle.sequence.map((item, index) => (
              <React.Fragment key={index}>
                <span className="ps-pattern-item">{item}</span>
                <span className="ps-pattern-arrow">&gt;</span>
              </React.Fragment>
            ))}
            <span className="ps-pattern-question" aria-label="Missing next item">?</span>
          </div>
        )}

        {/* =========================================================
            2x2 Grid of Answer Option Cards (Light Gray ~#E4E4E4)
            ========================================================= */}
        {currentPuzzle && (
          <div className="ps-options-grid" role="group" aria-label="Answer options">
            {currentPuzzle.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let cardClass = 'ps-option-card';

              if (isAnswered) {
                if (isSelected && option.isCorrect) {
                  cardClass += ' ps-selected-correct';
                } else if (isSelected && !option.isCorrect) {
                  cardClass += ' ps-selected-wrong';
                } else if (!isSelected && option.isCorrect) {
                  // Reveal the correct option in green dashed outline
                  cardClass += ' ps-reveal-correct';
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  className={cardClass}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  aria-pressed={isSelected}
                  aria-label={option.isNota ? 'None of the above' : `Option ${option.text}`}
                >
                  <span className={`ps-option-text ${option.isNota ? 'ps-option-nota' : ''}`}>
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Result Feedback Line */}
        <div className="ps-feedback-box">
          {isAnswered && (
            <>
              <p className={`ps-feedback-text ${isCorrect ? 'ps-correct-msg' : 'ps-wrong-msg'}`}>
                {isCorrect
                  ? '✓ Brilliant! You found the right pattern!'
                  : '✕ Good try! Notice the rule above.'}
              </p>
              {currentPuzzle?.explanation && (
                <span className="ps-feedback-explanation">
                  {currentPuzzle.explanation}
                </span>
              )}
            </>
          )}
        </div>

        {/* =========================================================
            Green (~#3FA85C) Next Round Button
            ========================================================= */}
        <button
          type="button"
          className="ps-next-btn"
          onClick={handleNextRound}
          disabled={!isAnswered}
        >
          <span>Next Round →</span>
        </button>

        {/* Footer line (exact wording from Figma: "You can't win unless you learn how to loose") */}
        <footer className="ps-footer-note">
          You can't win unless you learn how to loose
        </footer>
      </div>
    </div>
  );
}
