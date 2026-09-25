import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DIFFICULTY_LEVELS, generateMemoryDeck } from './config';
import './MemoryMatchGame.css';

/**
 * Helper to format seconds matching the "Time: 00" or "MM:SS" style
 * @param {number} totalSeconds
 * @returns {string} formatted time string
 */
function formatGameTime(totalSeconds) {
  if (totalSeconds < 60) {
    return String(totalSeconds).padStart(2, '0');
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Helper to format score with leading zero (e.g., "00", "01", "06")
 * @param {number} score
 * @returns {string} formatted score string
 */
function formatGameScore(score) {
  return String(score).padStart(2, '0');
}

export default function MemoryMatchGame() {
  // Current difficulty key: 'easy' | 'medium' | 'hard'
  const [difficulty, setDifficulty] = useState('medium');
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);

  // Deck state
  const [deck, setDeck] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gameplay metrics
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // References
  const timerRef = useRef(null);
  const blankAutoFlipRef = useRef(null);
  const dropdownRef = useRef(null);

  const currentConfig = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.medium;

  /**
   * Initializes or resets the game board
   */
  const startNewGame = (diffKey = difficulty) => {
    // Clear any running timers or pending flip-backs
    if (timerRef.current) clearInterval(timerRef.current);
    if (blankAutoFlipRef.current) clearTimeout(blankAutoFlipRef.current);

    const newDeck = generateMemoryDeck(diffKey);
    setDeck(newDeck);
    setFlippedIndices([]);
    setMatchedPairIds([]);
    setIsProcessing(false);
    setScore(0);
    setSeconds(0);
    setTimerActive(false);
    setIsCompleted(false);
    setShowDiffDropdown(false);
  };

  // Mount & difficulty change handler
  useEffect(() => {
    startNewGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (blankAutoFlipRef.current) clearTimeout(blankAutoFlipRef.current);
    };
  }, [difficulty]);

  // Timer interval effect
  useEffect(() => {
    if (timerActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, isCompleted]);

  // Close difficulty dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDiffDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Handle card tap/click
   * @param {number} index - Index of card clicked
   */
  const handleCardClick = (index) => {
    // Ignore clicks if comparing cards, game is completed, or card is already revealed/matched
    if (isProcessing || isCompleted) return;
    if (flippedIndices.includes(index)) return;

    const clickedCard = deck[index];
    if (matchedPairIds.includes(clickedCard.pairId)) return;

    // Start timer on first card interaction
    if (!timerActive) {
      setTimerActive(true);
    }

    // Cancel any lone blank card auto-flip timer if a second card is clicked
    if (blankAutoFlipRef.current) {
      clearTimeout(blankAutoFlipRef.current);
      blankAutoFlipRef.current = null;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // CASE 1: First card flipped
    if (newFlipped.length === 1) {
      // If the lone flipped card is the blank card, give the player time to observe
      // and flip it back after ~900ms if no other card is tapped
      if (clickedCard.isBlank) {
        blankAutoFlipRef.current = setTimeout(() => {
          setFlippedIndices([]);
        }, 900);
      }
      return;
    }

    // CASE 2: Second card flipped -> Evaluate Match
    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = deck[firstIndex];
      const secondCard = deck[secondIndex];

      // Check if neither is blank AND their pairIds match
      const isMatch =
        !firstCard.isBlank &&
        !secondCard.isBlank &&
        firstCard.pairId === secondCard.pairId;

      if (isMatch) {
        // Correct pair found!
        const updatedMatched = [...matchedPairIds, firstCard.pairId];
        setMatchedPairIds(updatedMatched);
        setScore((prev) => prev + 1);
        setFlippedIndices([]);
        setIsProcessing(false);

        // Check if all pairs are uncovered
        if (updatedMatched.length === currentConfig.pairsCount) {
          handleGameCompletion();
        }
      } else {
        // No match (different symbols, or one/both is the blank card)
        // Flip both back face-down after short delay (~800ms)
        setTimeout(() => {
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 800);
      }
    }
  };

  /**
   * Handle game victory
   */
  const handleGameCompletion = () => {
    setIsCompleted(true);
    setTimerActive(false);

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#B5471B', '#E8A87C', '#FBF1E7', '#2E221D', '#F97316'],
      });
    } catch (e) {
      // confetti fallback
    }
  };

  /**
   * Switch difficulty level
   * @param {string} newDiff - 'easy' | 'medium' | 'hard'
   */
  const handleSelectDifficulty = (newDiff) => {
    setDifficulty(newDiff);
    setShowDiffDropdown(false);
  };

  return (
    <div className="mm-page-wrapper">
      <div className="mm-game-container">
        {/* Header */}
        <header className="mm-header">
          <div className="mm-title-row">
            <h1 className="mm-title">
              <span className="mm-lightbulb" role="img" aria-label="lightbulb">💡</span>
              Memory Match
            </h1>
          </div>

          {/* Difficulty Badge with interactive dropdown */}
          <div className="mm-difficulty-badge-container" ref={dropdownRef}>
            <button
              className="mm-difficulty-badge"
              onClick={() => setShowDiffDropdown((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={showDiffDropdown}
              title="Click to switch difficulty"
            >
              <span>Difficulty: {currentConfig.label}</span>
              <span style={{ fontSize: '10px', opacity: 0.65 }}>▼</span>
            </button>

            {showDiffDropdown && (
              <div className="mm-difficulty-dropdown" role="menu">
                {Object.values(DIFFICULTY_LEVELS).map((lvl) => (
                  <button
                    key={lvl.id}
                    className={`mm-difficulty-option ${difficulty === lvl.id ? 'active' : ''}`}
                    onClick={() => handleSelectDifficulty(lvl.id)}
                    role="menuitem"
                  >
                    <span>{lvl.label}</span>
                    <span style={{ fontSize: '11px', opacity: 0.75 }}>
                      {lvl.totalCards} cards
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Live Capsules: Time & Score */}
        <div className="mm-capsules-group">
          <div className="mm-capsule" aria-live="polite">
            Time: {formatGameTime(seconds)}
          </div>
          <div className="mm-capsule" aria-live="polite">
            Score: {formatGameScore(score)}
          </div>
        </div>

        {/* 3-Column Card Grid */}
        <main
          className={`mm-card-grid ${currentConfig.totalCards === 13 ? 'mm-grid-13' : ''}`}
          aria-label="Memory match cards grid"
        >
          {deck.map((card, index) => {
            const isFlipped = flippedIndices.includes(index);
            const isMatched = matchedPairIds.includes(card.pairId);
            const isFaceUp = isFlipped || isMatched;

            return (
              <div
                key={card.id}
                className={`mm-card-wrapper ${isFaceUp ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                onClick={() => handleCardClick(index)}
                role="button"
                tabIndex={0}
                aria-label={
                  isFaceUp
                    ? card.isBlank
                      ? 'Blank card revealed'
                      : `Card ${card.symbol} revealed`
                    : 'Hidden card face down'
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(index);
                  }
                }}
              >
                <div className="mm-card-inner">
                  {/* Face Down Side: Dusty peach tile with centered black star */}
                  <div className="mm-card-face mm-card-front">
                    <span className="mm-card-star" aria-hidden="true">★</span>
                  </div>

                  {/* Face Up Side: Symbol or Plain Blank */}
                  <div
                    className={`mm-card-face mm-card-back ${card.isBlank ? 'mm-card-blank' : ''}`}
                  >
                    {!card.isBlank && (
                      <span className="mm-card-symbol">{card.symbol}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </main>

        {/* Footer Quote */}
        <footer className="mm-footer">
          <p className="mm-quote-text">
            Win if you can, loose if you must,
            <br />
            but never give up.
          </p>
        </footer>

        {/* Completion Modal */}
        {isCompleted && (
          <div className="mm-modal-overlay" role="dialog" aria-modal="true">
            <div className="mm-modal-celebration-icon" role="img" aria-label="trophy">🏆</div>
            <h2 className="mm-modal-title">Well Done!</h2>
            <p className="mm-modal-subtitle">
              You uncovered all pairs on {currentConfig.label} mode!
            </p>

            <div className="mm-modal-stats-card">
              <div className="mm-modal-stat-item">
                <span className="mm-modal-stat-label">Total Time</span>
                <span className="mm-modal-stat-value">{formatGameTime(seconds)}</span>
              </div>
              <div className="mm-modal-stat-item">
                <span className="mm-modal-stat-label">Pairs Matched</span>
                <span className="mm-modal-stat-value">
                  {matchedPairIds.length} / {currentConfig.pairsCount}
                </span>
              </div>
            </div>

            <button
              className="mm-btn-play-again"
              onClick={() => startNewGame(difficulty)}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
