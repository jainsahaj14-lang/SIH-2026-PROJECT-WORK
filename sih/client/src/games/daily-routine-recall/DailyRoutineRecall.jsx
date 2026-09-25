import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Check, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { DEFAULT_ROUTINE, shuffleArray } from './routineConfig';
import './DailyRoutineRecall.css';

/**
 * DailyRoutineRecall
 * 
 * Self-contained drag-and-drop & touch-enabled memory sequencing exercise.
 * Matches the phone-mockup UI, zigzag sequence diagram with diagonal connecting arrows,
 * floating tray icons, and gentle feedback.
 * 
 * @param {Object} props
 * @param {Object} [props.routine] - Configurable routine specification (defaults to DEFAULT_ROUTINE)
 * @param {Function} [props.onComplete] - Callback fired on sequence solved successfully
 * @param {boolean} [props.showPhoneFrame=true] - Whether to render inside the phone mockup container
 * @param {boolean} [props.enableVoice=false] - Whether to enable TTS speech prompts if supported
 */
export default function DailyRoutineRecall({
  routine = DEFAULT_ROUTINE,
  onComplete,
  showPhoneFrame = true,
  enableVoice = true,
}) {
  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  // Placed activities mapped by step number: { 1: activityObj, 2: activityObj, ... }
  const [placements, setPlacements] = useState({});

  // Activities available in the tray (randomized positions upon load/reset)
  const [trayActivities, setTrayActivities] = useState(() => {
    return shuffleArray(routine.trayActivities);
  });

  // Tap-to-select state (for accessibility/elderly users without requiring drag)
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Active drag state
  const [draggedItem, setDraggedItem] = useState(null); // { source: 'tray'|'step', activity, stepNumber }
  const [hoveredStep, setHoveredStep] = useState(null); // Step number currently under pointer

  // Mobile Touch Drag State
  const [touchGhost, setTouchGhost] = useState(null); // { x, y, activity }
  const touchStateRef = useRef(null); // Stores active touch drag info

  // Feedback & Modal
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'info', message: string }
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Connecting arrows dynamically calculated coordinates
  const [arrowLines, setArrowLines] = useState([]);
  const sequenceContainerRef = useRef(null);
  const stepRefs = useRef({});

  // -------------------------------------------------------------
  // 1. Dynamic SVG Arrow Positioning
  // -------------------------------------------------------------
  const updateArrowCoordinates = useCallback(() => {
    if (!sequenceContainerRef.current) return;
    const containerRect = sequenceContainerRef.current.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) return;

    const newLines = [];
    const steps = routine.steps;

    for (let i = 0; i < steps.length - 1; i++) {
      const currentStepNum = steps[i].stepNumber;
      const nextStepNum = steps[i + 1].stepNumber;

      const fromElem = stepRefs.current[currentStepNum];
      const toElem = stepRefs.current[nextStepNum];

      if (fromElem && toElem) {
        const fromRect = fromElem.getBoundingClientRect();
        const toRect = toElem.getBoundingClientRect();

        // Calculate positions relative to sequenceContainerRef
        const isFromLeft = steps[i].align === 'left';
        
        let startX, startY, endX, endY;

        if (isFromLeft) {
          // From left box to right box (pointing down-right)
          startX = fromRect.right - containerRect.left;
          startY = fromRect.top + fromRect.height * 0.65 - containerRect.top;
          endX = toRect.left - containerRect.left - 4; // slight offset for arrowhead
          endY = toRect.top + toRect.height * 0.35 - containerRect.top;
        } else {
          // From right box to left box (pointing down-left)
          startX = fromRect.left - containerRect.left;
          startY = fromRect.top + fromRect.height * 0.65 - containerRect.top;
          endX = toRect.right - containerRect.left + 4;
          endY = toRect.top + toRect.height * 0.35 - containerRect.top;
        }

        newLines.push({
          id: `arrow-${currentStepNum}-to-${nextStepNum}`,
          startX,
          startY,
          endX,
          endY,
        });
      }
    }

    setArrowLines(newLines);
  }, [routine.steps]);

  // Recalculate arrows on layout changes or window resize
  useLayoutEffect(() => {
    updateArrowCoordinates();
    window.addEventListener('resize', updateArrowCoordinates);
    const timer = setTimeout(updateArrowCoordinates, 120);

    return () => {
      window.removeEventListener('resize', updateArrowCoordinates);
      clearTimeout(timer);
    };
  }, [updateArrowCoordinates]);

  // -------------------------------------------------------------
  // 2. Validation Logic
  // -------------------------------------------------------------
  const checkFullSequence = useCallback((currentPlacements) => {
    // Only check once all 5 steps have an activity
    const filledCount = Object.keys(currentPlacements).length;
    if (filledCount < routine.totalSteps) {
      setFeedback(null);
      return;
    }

    // Verify each step matches its configured correctActivityId
    let isCorrect = true;
    for (const step of routine.steps) {
      const placed = currentPlacements[step.stepNumber];
      if (!placed || placed.id !== step.correctActivityId) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      // SUCCESS!
      setFeedback(null);
      setIsSuccessModalOpen(true);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'],
        });
      } catch (e) {
        // Confetti fallback
      }

      // Notify external parent handler
      if (onComplete) {
        const timeTakenSec = Math.round((Date.now() - startTime) / 1000);
        onComplete({
          routineId: routine.id,
          success: true,
          timeTakenSec,
          placements: currentPlacements,
        });
      }
    } else {
      // Gentle error / retry message as required: "Not quite right, try again!"
      setFeedback({
        type: 'error',
        message: 'Not quite right, try again!',
      });
    }
  }, [routine, onComplete, startTime]);

  // -------------------------------------------------------------
  // 3. Activity Placement & Swap Handlers
  // -------------------------------------------------------------
  const placeActivityInStep = useCallback((stepNumber, activity, sourceStepNumber = null) => {
    setPlacements((prev) => {
      const updated = { ...prev };

      // If moving from another step box (swapping)
      if (sourceStepNumber && sourceStepNumber !== stepNumber) {
        const displacedActivity = updated[stepNumber];
        if (displacedActivity) {
          updated[sourceStepNumber] = displacedActivity;
        } else {
          delete updated[sourceStepNumber];
        }
      }

      // Place the activity in the target step box
      updated[stepNumber] = activity;

      // Check if sequence is now completely filled
      setTimeout(() => checkFullSequence(updated), 50);
      return updated;
    });

    setSelectedActivity(null);
    setHoveredStep(null);
  }, [checkFullSequence]);

  const removeActivityFromStep = useCallback((stepNumber) => {
    setPlacements((prev) => {
      const updated = { ...prev };
      delete updated[stepNumber];
      setFeedback(null);
      return updated;
    });
  }, []);

  // -------------------------------------------------------------
  // 4. Tap-To-Place Handler (Elderly & Accessibility Friendly)
  // -------------------------------------------------------------
  const handleTrayItemTap = (activity) => {
    // If activity is already placed, ignore tap
    const isPlaced = Object.values(placements).some((p) => p?.id === activity.id);
    if (isPlaced) return;

    if (selectedActivity?.id === activity.id) {
      setSelectedActivity(null);
    } else {
      setSelectedActivity(activity);
    }
  };

  const handleStepTap = (stepNumber) => {
    const existing = placements[stepNumber];

    // If an activity was selected in tray, place it here!
    if (selectedActivity) {
      placeActivityInStep(stepNumber, selectedActivity);
      return;
    }

    // If step is already filled and user taps it, remove it back to tray
    if (existing) {
      removeActivityFromStep(stepNumber);
    }
  };

  // -------------------------------------------------------------
  // 5. Native Desktop HTML5 Drag and Drop Handlers
  // -------------------------------------------------------------
  const handleDragStartTray = (e, activity) => {
    const isPlaced = Object.values(placements).some((p) => p?.id === activity.id);
    if (isPlaced) {
      e.preventDefault();
      return;
    }

    const dragPayload = { source: 'tray', activity };
    setDraggedItem(dragPayload);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartStep = (e, stepNumber, activity) => {
    const dragPayload = { source: 'step', stepNumber, activity };
    setDraggedItem(dragPayload);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverStep = (e, stepNumber) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredStep !== stepNumber) {
      setHoveredStep(stepNumber);
    }
  };

  const handleDragLeaveStep = (e, stepNumber) => {
    if (hoveredStep === stepNumber) {
      setHoveredStep(null);
    }
  };

  const handleDropOnStep = (e, stepNumber) => {
    e.preventDefault();
    setHoveredStep(null);

    let dragData = draggedItem;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) dragData = JSON.parse(raw);
      } catch (err) {
        // Fallback
      }
    }

    if (!dragData || !dragData.activity) return;

    if (dragData.source === 'tray') {
      placeActivityInStep(stepNumber, dragData.activity);
    } else if (dragData.source === 'step') {
      placeActivityInStep(stepNumber, dragData.activity, dragData.stepNumber);
    }

    setDraggedItem(null);
  };

  const handleDropOnTray = (e) => {
    e.preventDefault();
    if (draggedItem && draggedItem.source === 'step') {
      removeActivityFromStep(draggedItem.stepNumber);
    }
    setDraggedItem(null);
    setHoveredStep(null);
  };

  // -------------------------------------------------------------
  // 6. Native Mobile Touch Drag Handlers
  // -------------------------------------------------------------
  const handleTouchStart = (e, activity, source = 'tray', stepNumber = null) => {
    const isPlaced = Object.values(placements).some((p) => p?.id === activity.id);
    if (source === 'tray' && isPlaced) return;

    const touch = e.touches[0];
    touchStateRef.current = {
      activity,
      source,
      stepNumber,
      startX: touch.clientX,
      startY: touch.clientY,
    };

    setTouchGhost({
      x: touch.clientX,
      y: touch.clientY,
      activity,
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStateRef.current) return;
    const touch = e.touches[0];

    // Update floating touch preview position
    setTouchGhost({
      x: touch.clientX,
      y: touch.clientY,
      activity: touchStateRef.current.activity,
    });

    // Determine element under the finger
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const stepElem = element.closest('[data-step-number]');
      if (stepElem) {
        const stepNum = parseInt(stepElem.getAttribute('data-step-number'), 10);
        setHoveredStep(stepNum);
        return;
      }
    }
    setHoveredStep(null);
  };

  const handleTouchEnd = (e) => {
    if (!touchStateRef.current) return;
    const { activity, source, stepNumber } = touchStateRef.current;
    const touch = e.changedTouches[0];

    // Check where the touch ended
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const stepElem = element.closest('[data-step-number]');
      const trayElem = element.closest('[data-tray-area]');

      if (stepElem) {
        const targetStepNum = parseInt(stepElem.getAttribute('data-step-number'), 10);
        if (source === 'tray') {
          placeActivityInStep(targetStepNum, activity);
        } else if (source === 'step') {
          placeActivityInStep(targetStepNum, activity, stepNumber);
        }
      } else if (trayElem && source === 'step') {
        removeActivityFromStep(stepNumber);
      }
    }

    touchStateRef.current = null;
    setTouchGhost(null);
    setHoveredStep(null);
  };

  // -------------------------------------------------------------
  // 7. Reset Game Handler
  // -------------------------------------------------------------
  const handleReset = () => {
    setPlacements({});
    setTrayActivities(shuffleArray(routine.trayActivities));
    setSelectedActivity(null);
    setFeedback(null);
    setIsSuccessModalOpen(false);
    setHoveredStep(null);
  };

  // -------------------------------------------------------------
  // Render: Component Layout
  // -------------------------------------------------------------
  const content = (
    <div
      className="drr-card"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 1. Header Section */}
      <div>
        <div className="drr-header">
          <div className="drr-title-wrapper">
            <span className="drr-title-emoji" role="img" aria-label="bell">
              {routine.titleEmoji || '🔔'}
            </span>
            <h2 className="drr-title">{routine.title}</h2>
          </div>
          <button
            className="drr-btn-reset"
            onClick={handleReset}
            title="Reset and shuffle tray"
            type="button"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>

        {/* Thin divider line below title */}
        <div className="drr-divider" />
      </div>

      {/* 2. Sequence Diagram (Zigzag 5-Step Connected Flow) */}
      <div className="drr-sequence-container" ref={sequenceContainerRef}>
        {/* SVG Arrow layer connecting the zigzag boxes */}
        <svg className="drr-arrow-canvas" aria-hidden="true">
          <defs>
            <marker
              id="drr-arrowhead"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#000000" />
            </marker>
          </defs>
          {arrowLines.map((line) => (
            <line
              key={line.id}
              x1={line.startX}
              y1={line.startY}
              x2={line.endX}
              y2={line.endY}
              stroke="#000000"
              strokeWidth="1.6"
              markerEnd="url(#drr-arrowhead)"
            />
          ))}
        </svg>

        {/* 5 Step Boxes arranged in alternating zigzag rows */}
        {routine.steps.map((step) => {
          const placedActivity = placements[step.stepNumber];
          const isOver = hoveredStep === step.stepNumber;
          const isTargetReady = selectedActivity && !placedActivity;

          return (
            <div
              key={step.stepNumber}
              className={`drr-step-row ${
                step.align === 'left' ? 'drr-align-left' : 'drr-align-right'
              }`}
            >
              <div
                ref={(el) => (stepRefs.current[step.stepNumber] = el)}
                data-step-number={step.stepNumber}
                className={`drr-step-box ${isOver ? 'drr-drag-over' : ''} ${
                  placedActivity ? 'drr-filled' : ''
                } ${isTargetReady ? 'drr-target-ready' : ''}`}
                onClick={() => handleStepTap(step.stepNumber)}
                onDragOver={(e) => handleDragOverStep(e, step.stepNumber)}
                onDragLeave={(e) => handleDragLeaveStep(e, step.stepNumber)}
                onDrop={(e) => handleDropOnStep(e, step.stepNumber)}
                draggable={!!placedActivity}
                onDragStart={(e) =>
                  placedActivity &&
                  handleDragStartStep(e, step.stepNumber, placedActivity)
                }
                onTouchStart={(e) =>
                  placedActivity &&
                  handleTouchStart(e, placedActivity, 'step', step.stepNumber)
                }
                title={
                  placedActivity
                    ? `Step ${step.stepNumber}: ${placedActivity.label} (Drag or tap to remove)`
                    : `Drop activity onto Step ${step.stepNumber}`
                }
              >
                {placedActivity ? (
                  <div className="drr-step-content">
                    <span className="drr-step-emoji">{placedActivity.emoji}</span>
                    <span className="drr-step-label">{placedActivity.label}</span>
                    {/* Subtle quick remove badge */}
                    <button
                      className="drr-step-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeActivityFromStep(step.stepNumber);
                      }}
                      title="Remove activity"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="drr-step-placeholder">{step.label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Activity Tray Section (Rounded Bordered Box with Floating Items) */}
      <div
        className="drr-tray-container"
        data-tray-area="true"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnTray}
      >
        {/* Row 1: Two activities (e.g. wake up, bathing) */}
        <div className="drr-tray-row">
          {trayActivities.slice(0, 2).map((activity) => renderTrayItem(activity))}
        </div>

        {/* Row 2: Centered single activity (e.g. brush your teeth) */}
        <div className="drr-tray-row drr-tray-row-center">
          {trayActivities.slice(2, 3).map((activity) => renderTrayItem(activity))}
        </div>

        {/* Row 3: Two activities (e.g. eat food, medicine time) */}
        <div className="drr-tray-row">
          {trayActivities.slice(3, 5).map((activity) => renderTrayItem(activity))}
        </div>
      </div>

      {/* 4. Feedback Notice (Gentle retry message when incomplete/incorrect) */}
      {feedback && (
        <div
          className={`drr-feedback-banner ${
            feedback.type === 'error' ? 'drr-feedback-error' : 'drr-feedback-info'
          }`}
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 5. Mobile Touch Dragging Floating Ghost */}
      {touchGhost && (
        <div
          className="drr-touch-ghost"
          style={{
            left: `${touchGhost.x}px`,
            top: `${touchGhost.y}px`,
          }}
        >
          <span className="drr-ghost-emoji">{touchGhost.activity.emoji}</span>
          <span className="drr-ghost-label">{touchGhost.activity.label}</span>
        </div>
      )}

      {/* 6. Success Modal Popup */}
      {isSuccessModalOpen && (
        <div className="drr-modal-backdrop">
          <div className="drr-modal-card">
            <div className="drr-modal-icon-circle">
              <Check size={36} strokeWidth={3} />
            </div>
            <h3 className="drr-modal-title">Routine recalled successfully!</h3>
            <p className="drr-modal-subtitle">
              All 5 daily activities are in their logical sequence.
            </p>
            <button
              className="drr-modal-btn-play"
              onClick={handleReset}
              type="button"
            >
              <Sparkles size={18} />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render individual tray items
  function renderTrayItem(activity) {
    if (!activity) return null;
    const isPlaced = Object.values(placements).some((p) => p?.id === activity.id);
    const isSelected = selectedActivity?.id === activity.id;

    return (
      <div
        key={activity.id}
        className={`drr-tray-item ${isPlaced ? 'drr-placed' : ''} ${
          isSelected ? 'drr-selected' : ''
        }`}
        onClick={() => handleTrayItemTap(activity)}
        draggable={!isPlaced}
        onDragStart={(e) => handleDragStartTray(e, activity)}
        onTouchStart={(e) => handleTouchStart(e, activity, 'tray')}
        title={
          isPlaced
            ? `${activity.label} (Placed)`
            : `Drag or tap to place "${activity.label}"`
        }
        role="button"
        tabIndex={isPlaced ? -1 : 0}
        aria-disabled={isPlaced}
      >
        <span className="drr-tray-emoji" role="img" aria-label={activity.label}>
          {activity.emoji}
        </span>
        <span className="drr-tray-label">{activity.label}</span>
      </div>
    );
  }

  // Wrap in phone mockup container if requested
  if (showPhoneFrame) {
    return (
      <div className="drr-wrapper">
        <div className="drr-phone-mockup">
          {/* Subtle phone speaker notch at top */}
          <div className="drr-phone-notch">
            <div className="drr-notch-camera" />
            <div className="drr-notch-speaker" />
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
