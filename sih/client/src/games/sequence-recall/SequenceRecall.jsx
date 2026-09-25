import React, { useState, useEffect, useRef } from 'react';
import {
  STORAGE_KEY_HIGH_SCORE,
  soundEngine,
  calculateAdaptiveSpeed,
  getPlaybackTimings,
  SPEED_BOUNDS,
} from './config';
import './SequenceRecall.css';

export default function SequenceRecall() {
  // Game states: 'idle' | 'playback' | 'player_turn' | 'game_over'
  const [gameState, setGameState] = useState('idle');

  // Sequence of tile indices (0-8)
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);

  // Active lit tile index during playback or user tap
  const [litTile, setLitTile] = useState(null);
  // Incorrectly clicked tile index during error
  const [errorTile, setErrorTile] = useState(null);

  // Scoring
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Adaptive difficulty tracking
  const [playbackSpeed, setPlaybackSpeed] = useState(SPEED_BOUNDS.INITIAL_TOTAL);
  const [paceLabel, setPaceLabel] = useState('Normal Pace');

  // Timers and references
  const playbackTimeoutRef = useRef(null);
  const playerClickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(null);
  const roundReactionTimesRef = useRef([]);

  // Load High Score from localStorage on mount
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      if (savedHigh !== null) {
        setHighScore(parseInt(savedHigh, 10) || 0);
      }
    } catch (e) {
      // localStorage fallback
    }

    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
    if (playerClickTimeoutRef.current) clearTimeout(playerClickTimeoutRef.current);
  };

  /**
   * Starts a completely new game
   */
  const startNewGame = () => {
    clearAllTimers();
    setScore(0);
    setErrorTile(null);
    setLitTile(null);
    setPlayerStep(0);
    roundReactionTimesRef.current = [];
    lastClickTimeRef.current = null;

    // Pick first random tile (0-8)
    const initialTile = Math.floor(Math.random() * 9);
    const newSeq = [initialTile];
    setSequence(newSeq);

    // Playback sequence to player
    playSequence(newSeq, playbackSpeed);
  };

  /**
   * Plays the sequence so far to the player one tile at a time
   * @param {number[]} seqToPlay
   * @param {number} speed
   */
  const playSequence = (seqToPlay, speed) => {
    setGameState('playback');
    setPlayerStep(0);
    setErrorTile(null);
    roundReactionTimesRef.current = [];

    const { highlightMs, gapMs } = getPlaybackTimings(speed);

    seqToPlay.forEach((tileIdx, stepIdx) => {
      // Highlight tile
      const lightOnTime = stepIdx * (highlightMs + gapMs);
      playbackTimeoutRef.current = setTimeout(() => {
        setLitTile(tileIdx);
        soundEngine.playTileTone(tileIdx, highlightMs);

        // Turn off highlight after duration
        playbackTimeoutRef.current = setTimeout(() => {
          setLitTile(null);

          // Once the last tile finishes playback, player's turn begins
          if (stepIdx === seqToPlay.length - 1) {
            playbackTimeoutRef.current = setTimeout(() => {
              setGameState('player_turn');
              lastClickTimeRef.current = Date.now();
            }, gapMs);
          }
        }, highlightMs);
      }, lightOnTime);
    });
  };

  /**
   * Handles player tapping/clicking a tile
   * @param {number} tileIndex
   */
  const handleTileClick = (tileIndex) => {
    // If game is idle, starting with this tile is allowed
    if (gameState === 'idle') {
      startNewGame();
      return;
    }

    // Only allow input during player turn
    if (gameState !== 'player_turn') return;

    const now = Date.now();
    if (lastClickTimeRef.current) {
      roundReactionTimesRef.current.push(now - lastClickTimeRef.current);
    }
    lastClickTimeRef.current = now;

    const expectedTile = sequence[playerStep];

    // CASE 1: CORRECT TILE PRESSED
    if (tileIndex === expectedTile) {
      // Flash tile lit briefly + sound tone
      setLitTile(tileIndex);
      soundEngine.playTileTone(tileIndex, 180);

      if (playerClickTimeoutRef.current) clearTimeout(playerClickTimeoutRef.current);
      playerClickTimeoutRef.current = setTimeout(() => {
        setLitTile(null);
      }, 180);

      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      // Check if entire sequence was successfully reproduced
      if (nextStep === sequence.length) {
        // Round Success!
        const newScore = sequence.length;
        setScore(newScore);

        // Update High Score if broken
        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(newScore));
          } catch (e) {}
        }

        // Calculate average reaction time for this round
        const times = roundReactionTimesRef.current;
        const avgReaction =
          times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 600;

        // Adapt difficulty speed based on player speed
        const nextSpeed = calculateAdaptiveSpeed(playbackSpeed, avgReaction);
        setPlaybackSpeed(nextSpeed);

        if (nextSpeed <= 400) {
          setPaceLabel('⚡ Fast Pace');
        } else if (nextSpeed >= 750) {
          setPaceLabel('🌱 Relaxed Pace');
        } else {
          setPaceLabel('✨ Balanced Pace');
        }

        // Advance to next round: add 1 new random tile
        setGameState('playback');
        const nextRandomTile = Math.floor(Math.random() * 9);
        const updatedSequence = [...sequence, nextRandomTile];
        setSequence(updatedSequence);

        // Wait a short pause (~800ms) before starting sequence playback
        playbackTimeoutRef.current = setTimeout(() => {
          playSequence(updatedSequence, nextSpeed);
        }, 850);
      }
    } else {
      // CASE 2: WRONG TILE PRESSED (GAME OVER)
      setErrorTile(tileIndex);
      soundEngine.playErrorTone();
      setGameState('game_over');

      // Keep error red flash visible
      if (playerClickTimeoutRef.current) clearTimeout(playerClickTimeoutRef.current);
    }
  };

  return (
    <div className="sr-page-wrapper">
      <div className="sr-container">
        {/* Title: 2 Lines, Bold Black Rounded */}
        <h1 className="sr-title">
          Sequence
          <br />
          Recall
        </h1>

        {/* 3x3 Grid in Thick Black Frame */}
        <div className="sr-grid-frame" role="region" aria-label="Sequence Recall Grid">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
            const isLit = litTile === index;
            const isError = errorTile === index;

            return (
              <button
                key={index}
                className={`sr-tile ${isLit ? 'sr-lit' : ''} ${isError ? 'sr-error' : ''}`}
                onClick={() => handleTileClick(index)}
                disabled={gameState === 'playback'}
                aria-label={`Tile ${index + 1}`}
                type="button"
              />
            );
          })}
        </div>

        {/* Action / Banner Area */}
        <div className="sr-status-banner">
          {gameState === 'idle' && (
            <button className="sr-btn-action" onClick={startNewGame}>
              Start Game
            </button>
          )}

          {gameState === 'playback' && (
            <span className="sr-pill-indicator">Watch the sequence...</span>
          )}

          {gameState === 'player_turn' && (
            <span className="sr-pill-indicator">
              Your turn! ({playerStep}/{sequence.length})
            </span>
          )}

          {gameState === 'game_over' && (
            <button className="sr-btn-action" onClick={startNewGame}>
              Try Again
            </button>
          )}
        </div>

        {/* Adaptive speed badge */}
        {gameState !== 'idle' && (
          <div className="sr-adaptive-badge">
            {paceLabel} ({playbackSpeed}ms)
          </div>
        )}

        {/* Scores: Left-Aligned, Bold Black Fredoka Font */}
        <div className="sr-scores-container">
          <div className="sr-score-row">
            <span>Score:</span>
            <span className="sr-score-value">{score}</span>
          </div>
          <div className="sr-score-row">
            <span>High Score:</span>
            <span className="sr-score-value">{highScore}</span>
          </div>
        </div>

        {/* Italicized Quote at the Bottom */}
        <p className="sr-quote">
          “Trust your mind but
          <br />
          double check your traces”
        </p>
      </div>
    </div>
  );
}
