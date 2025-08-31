import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useMaterial } from '../helpers/readingMaterialsQueries';
import { useWordClickMutation } from '../helpers/useWordClickMutation';
import { useStartReadingSession, useUpdateReadingProgress, useCompleteReadingSession, useUserProgress } from '../helpers/useReadingProgress';
import { useAuth } from '../helpers/useAuth';
import { useUserAchievements, useRewards, useChallenges } from '../helpers/useGamification';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';
import { Slider } from '../components/Slider';
import { Progress } from '../components/Progress';
import { AccessibilityControls } from '../components/AccessibilityControls';
import { DyslexiaFontToggle } from '../components/DyslexiaFontToggle';
import { HighContrastToggle } from '../components/HighContrastToggle';
import { Separator } from '../components/Separator';
import { ProgressCelebration } from '../components/ProgressCelebration';
import { Badge } from '../components/Badge';
import {
  Play, Pause, Rewind, Volume2, Settings, ArrowLeft, Minus, Plus, User, Clock, Target, Accessibility, Trophy, Star, Flame
} from 'lucide-react';
import styles from './read.$materialId.module.css';

const ReaderSkeleton = () => (
  <div className={styles.container}>
    <div className={styles.header}>
      <Skeleton style={{ height: '2.5rem', width: '120px' }} />
      <Skeleton style={{ height: '2rem', width: '200px' }} />
    </div>
    <div className={styles.content}>
      <Skeleton style={{ height: '2rem', width: '70%', marginBottom: 'var(--spacing-6)' }} />
      <Skeleton style={{ height: '1rem', width: '90%' }} />
      <Skeleton style={{ height: '1rem', width: '95%' }} />
      <Skeleton style={{ height: '1rem', width: '85%' }} />
      <Skeleton style={{ height: '1rem', width: '90%', marginTop: 'var(--spacing-4)' }} />
      <Skeleton style={{ height: '1rem', width: '80%' }} />
    </div>
    <div className={styles.controls}>
      <Skeleton style={{ height: '3rem', width: '100%' }} />
    </div>
  </div>
);

interface WordToken {
  text: string;
  isWord: boolean;
  index: number;
}

const ReadPage = () => {
  const { materialId } = useParams();
  const id = materialId ? parseInt(materialId, 10) : undefined;
  const { data: material, isFetching, error } = useMaterial(id);
  const { authState } = useAuth();
  const wordClickMutation = useWordClickMutation();
  
  // Progress tracking hooks
  const startSessionMutation = useStartReadingSession();
  const updateProgressMutation = useUpdateReadingProgress();
  const completeSessionMutation = useCompleteReadingSession();
  const { data: userProgress } = useUserProgress({ materialId: id });
  
  // Gamification hooks
  const { data: userAchievements } = useUserAchievements();
  const { data: rewardsData } = useRewards();
  const { data: challengesData } = useChallenges();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [clickedWordIndex, setClickedWordIndex] = useState<number | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [speechRate, setSpeechRate] = useState(1);
  const speechRateRef = useRef(1);
  const wordCounterRef = useRef(0);

  // Session tracking state
  const [readingSessionId, setReadingSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [wordsClickedInSession, setWordsClickedInSession] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<Date>(new Date());
  
  // Refs to prevent infinite loops
  const sessionStartedRef = useRef(false);
  const sessionCompletedRef = useRef(false);

  // Gamification state
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    type: 'achievement' | 'level-up' | 'streak';
    title: string;
    message: string;
  } | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  const currentUser = authState.type === 'authenticated' ? authState.user : null;

  // Parse content into tokens (words and punctuation/whitespace)
  const tokens: WordToken[] = React.useMemo(() => {
    if (!material?.content) return [];
    
    const result: WordToken[] = [];
    let wordIndex = 0;
    
    // Split by word boundaries but keep separators
    const parts = material.content.split(/(\s+|[.!?,:;()"])/);
    
    parts.forEach(part => {
      if (part.trim() && !/^\s+$/.test(part) && !/^[.!?,:;()"]+$/.test(part)) {
        // This is a word
        result.push({
          text: part,
          isWord: true,
          index: wordIndex
        });
        wordIndex++;
      } else {
        // This is punctuation or whitespace
        result.push({
          text: part,
          isWord: false,
          index: -1
        });
      }
    });
    
    return result;
  }, [material?.content]);

  const words = tokens.filter(token => token.isWord);

  // Start reading session when material loads
  useEffect(() => {
    if (material && currentUser && !readingSessionId && !sessionStartedRef.current) {
      console.log('Starting reading session for material:', material.id);
      sessionStartedRef.current = true;
      startSessionMutation.mutate({ materialId: material.id });
    }
  }, [material, currentUser, readingSessionId]);

  // Handle successful session start
  useEffect(() => {
    if (startSessionMutation.data?.readingSessionId && !readingSessionId) {
      setReadingSessionId(startSessionMutation.data.readingSessionId);
      setSessionStartTime(new Date());
      console.log('Reading session started:', startSessionMutation.data.readingSessionId);
    }
  }, [startSessionMutation.data, readingSessionId]);

  // Debounced progress update function
  const debouncedUpdateProgress = useCallback(() => {
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }

    progressUpdateTimeoutRef.current = setTimeout(() => {
      if (readingSessionId && words.length > 0) {
        const progressPercentage = ((currentWordIndex + 1) / words.length) * 100;
        
        console.log('Updating progress:', {
          sessionId: readingSessionId,
          progress: progressPercentage,
          position: currentWordIndex,
          wordsClicked: wordsClickedInSession
        });

        updateProgressMutation.mutate({
          readingSessionId,
          lastPosition: currentWordIndex,
          progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
          wordsClickedCount: wordsClickedInSession
        });

        setWordsClickedInSession(0); // Reset counter after update
        setLastProgressUpdate(new Date());
      }
    }, 2000); // 2 second debounce
  }, [readingSessionId, currentWordIndex, words.length, wordsClickedInSession]);

  // Update progress when reading position changes
  useEffect(() => {
    if (readingSessionId && words.length > 0) {
      debouncedUpdateProgress();
    }
  }, [currentWordIndex, readingSessionId, words.length, debouncedUpdateProgress]);

  // Complete session on unmount or when finishing
  useEffect(() => {
    return () => {
      if (readingSessionId && !sessionCompletedRef.current) {
        console.log('Completing reading session on unmount');
        sessionCompletedRef.current = true;
        completeSessionMutation.mutate({ readingSessionId });
      }
    };
  }, [readingSessionId]);

  // Complete session when reaching 100%
  useEffect(() => {
    if (readingProgress >= 100 && readingSessionId && !sessionCompletedRef.current && !completeSessionMutation.isPending) {
      console.log('Completing reading session - 100% reached');
      sessionCompletedRef.current = true;
      completeSessionMutation.mutate({ readingSessionId });
      
      // Show completion celebration
      setCelebrationState({
        isOpen: true,
        type: 'achievement',
        title: 'Reading Complete!',
        message: `Great job finishing "${material?.title}"! You've earned points for this achievement.`
      });
      
      // Animate points earned
      setPointsEarned(25); // Base completion points
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 3000);
    }
  }, [readingProgress, readingSessionId, completeSessionMutation.isPending, material?.title]);

  // Check for milestone celebrations
  useEffect(() => {
    if (readingProgress === 25 || readingProgress === 50 || readingProgress === 75) {
      setCelebrationState({
        isOpen: true,
        type: 'level-up',
        title: 'Reading Milestone!',
        message: `You're ${readingProgress}% through this story. Keep going!`
      });
      
      setPointsEarned(5); // Milestone points
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 2000);
    }
  }, [readingProgress]);

  // Check for word click achievements
  useEffect(() => {
    if (wordsClickedInSession > 0 && wordsClickedInSession % 10 === 0) {
      setCelebrationState({
        isOpen: true,
        type: 'streak',
        title: 'Word Explorer!',
        message: `You've clicked on ${wordsClickedInSession} words to learn their pronunciation. Great curiosity!`
      });
      
      setPointsEarned(2 * (wordsClickedInSession / 10)); // Points for exploration
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 2000);
    }
  }, [wordsClickedInSession]);

  // Update speechRate ref when state changes
  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Helper function to create utterance with fresh listeners
  const createUtteranceWithListeners = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRateRef.current;
    utterance.volume = 1;

    const handleEnd = () => {
      setIsSpeaking(false);
      setCurrentWordIndex(words.length - 1);
    };

    const handleBoundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        wordCounterRef.current += 1;
        setCurrentWordIndex(wordCounterRef.current - 1);
      }
    };

    utterance.addEventListener('end', handleEnd);
    utterance.addEventListener('boundary', handleBoundary);
    
    return utterance;
  }, [words.length]);

  const handleWordClick = async (word: string, wordIndex: number) => {
    if (!material) return;
    
    console.log('Word clicked:', word, 'at index:', wordIndex);
    
    // Set clicked word for visual feedback
    setClickedWordIndex(wordIndex);
    setTimeout(() => setClickedWordIndex(null), 300);
    
    // Increment session click counter
    setWordsClickedInSession(prev => prev + 1);
    
    // Immediately pronounce the word
    speechSynthesis.cancel(); // Cancel any current speech
    const wordUtterance = new SpeechSynthesisUtterance(word);
    wordUtterance.rate = speechRateRef.current;
    wordUtterance.volume = 1;
    speechSynthesis.speak(wordUtterance);
    
    // Track the word click
    try {
      await wordClickMutation.mutateAsync({
        word: word.toLowerCase().replace(/[^a-zA-Z]/g, ''), // Clean the word
        materialId: material.id,
        materialTitle: material.title,
        readingLevel: material.readingLevel
      });
    } catch (error) {
      console.error('Failed to track word click:', error);
    }
  };

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      const progress = ((currentWordIndex + 1) / words.length) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    }
  }, [currentWordIndex, words.length]);

  const handlePlayPause = () => {
    if (isSpeaking) {
      speechSynthesis.pause();
      setIsSpeaking(false);
    } else {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
      } else {
        if (!material) return;
        
        // Reset word counter if starting from beginning
        if (currentWordIndex === 0) {
          wordCounterRef.current = 0;
        }
        
        const utterance = createUtteranceWithListeners(material.content);
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      }
      setIsSpeaking(true);
    }
  };

  const handleRewind = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentWordIndex(0);
    wordCounterRef.current = 0; // Reset word counter
    
    if (material) {
      const utterance = createUtteranceWithListeners(material.content);
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Calculate session duration
  const sessionDuration = sessionStartTime 
    ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60) 
    : 0;

  // Get material progress from user progress data
  const materialProgress = userProgress?.find(p => p.materialId === id);

  // Get active challenges related to reading
  const activeReadingChallenges = challengesData?.challenges?.filter(
    challenge => challenge.challengeType === 'reading' && !challenge.completedAt
  ) || [];

  // Get next achievement to unlock
  const nextAchievement = userAchievements?.achievements?.find(
    achievement => !achievement.isCompleted
  );

  const handleCelebrationClose = () => {
    setCelebrationState(null);
  };

  if (isFetching || startSessionMutation.isPending) {
    return <ReaderSkeleton />;
  }

  if (error || !material) {
    return (
      <div className={styles.errorContainer}>
        <h2>Material not found</h2>
        <p>We couldn't find the reading material you were looking for.</p>
        <Button asChild>
          <Link to="/materials">Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reading: {material.title}</title>
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <Button asChild variant="ghost" size="sm">
            <Link to="/materials"><ArrowLeft size={16} /> Back to Library</Link>
          </Button>
          
          <div className={styles.userInfo}>
            {currentUser && (
              <div className={styles.userStats}>
                <div className={styles.userDetail}>
                  <User size={16} />
                  <span>{currentUser.displayName}</span>
                </div>
                <div className={styles.userDetail}>
                  <Clock size={16} />
                  <span>{sessionDuration} min</span>
                </div>
                {materialProgress && (
                  <div className={styles.userDetail}>
                    <Target size={16} />
                    <span>{Math.round(parseFloat(String(materialProgress.progressPercentage || 0)))}% complete</span>
                  </div>
                )}
                
                {/* Gamification Info */}
                {rewardsData && (
                  <div className={styles.userDetail}>
                    <Trophy size={16} />
                    <span className={showPointsAnimation ? styles.pointsAnimation : ''}>
                      {rewardsData.userPoints} pts
                      {showPointsAnimation && <span className={styles.pointsEarned}>+{pointsEarned}</span>}
                    </span>
                  </div>
                )}
                
                {nextAchievement && (
                  <div className={styles.userDetail}>
                    <Star size={16} />
                    <span>Next: {nextAchievement.name}</span>
                  </div>
                )}
                
                {activeReadingChallenges.length > 0 && (
                  <div className={styles.userDetail}>
                    <Flame size={16} />
                    <span>{activeReadingChallenges.length} challenge{activeReadingChallenges.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.progressContainer}>
            <Progress value={readingProgress} />
            <span>{Math.round(readingProgress)}%</span>
          </div>
        </header>

        <main className={styles.content} ref={contentRef} style={{ fontSize: `${fontSize}px` }}>
          <h1 className={styles.title}>{material.title}</h1>
          <div className={styles.readingMeta}>
            <span className={styles.readingLevel}>{material.readingLevel.replace('_', ' ').toUpperCase()}</span>
            <span className={styles.estimatedTime}>{material.estimatedReadingTimeMinutes} min read</span>
            
            {/* Active Challenge Progress */}
            {activeReadingChallenges.length > 0 && (
              <div className={styles.challengeIndicator}>
                <Badge variant="secondary">
                  <Flame size={12} />
                  {activeReadingChallenges[0].name}
                </Badge>
              </div>
            )}
          </div>
          <p className={styles.textContent}>
            {tokens.map((token, tokenIndex) => {
              if (token.isWord) {
                const isCurrentlyReading = token.index === currentWordIndex && isSpeaking;
                const isClicked = token.index === clickedWordIndex;
                
                return (
                  <span
                    key={tokenIndex}
                    className={`${styles.clickableWord} ${
                      isCurrentlyReading ? styles.highlightedWord : ''
                    } ${isClicked ? styles.clickedWord : ''}`}
                    onClick={() => handleWordClick(token.text, token.index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleWordClick(token.text, token.index);
                      }
                    }}
                    aria-label={`Click to hear pronunciation of ${token.text}`}
                    title={`Click to hear: ${token.text}`}
                  >
                    {token.text}
                  </span>
                );
              } else {
                return <span key={tokenIndex}>{token.text}</span>;
              }
            })}
          </p>
        </main>

        <footer className={styles.controls}>
          {showSettings && (
            <div className={styles.settingsPanel} role="dialog" aria-label="Reading and Accessibility Settings">
              <div className={styles.settingsHeader}>
                <h3>Reading & Accessibility Settings</h3>
                <Button 
                  size="icon-sm" 
                  variant="ghost" 
                  onClick={() => setShowSettings(false)}
                  aria-label="Close settings panel"
                >
                  <Settings size={16} />
                </Button>
              </div>
              
              <div className={styles.settingsContent}>
                <div className={styles.settingsSection}>
                  <h4>Reading Preferences</h4>
                  <div className={styles.setting}>
                    <label htmlFor="reading-font-size">Font Size</label>
                    <div className={styles.fontSizeControl}>
                      <Button 
                        id="decrease-font"
                        size="icon-sm" 
                        variant="outline" 
                        onClick={() => setFontSize(s => Math.max(12, s - 1))}
                        aria-label="Decrease font size"
                      >
                        <Minus size={14} />
                      </Button>
                      <span aria-live="polite">{fontSize}px</span>
                      <Button 
                        id="increase-font"
                        size="icon-sm" 
                        variant="outline" 
                        onClick={() => setFontSize(s => Math.min(32, s + 1))}
                        aria-label="Increase font size"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className={styles.setting}>
                    <label htmlFor="speech-rate-slider">Speech Speed</label>
                    <Slider
                      id="speech-rate-slider"
                      defaultValue={[speechRate]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={([value]) => setSpeechRate(value)}
                      aria-label="Speech speed"
                    />
                  </div>
                </div>

                <Separator className={styles.sectionSeparator} />

                <div className={styles.settingsSection}>
                  <h4>Accessibility Options</h4>
                  <AccessibilityControls className={styles.accessibilityControls} />
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.quickAccessControls}>
            <div className={styles.accessibilityToggles}>
              <DyslexiaFontToggle />
              <HighContrastToggle />
            </div>
          </div>

          <div className={styles.mainControls}>
            <Button variant="ghost" size="icon-lg" onClick={handleRewind} aria-label="Rewind to beginning">
              <Rewind />
            </Button>
            <Button 
              variant="primary" 
              size="icon-lg" 
              onClick={handlePlayPause} 
              aria-label={isSpeaking ? 'Pause reading' : 'Start reading aloud'}
            >
              {isSpeaking ? <Pause /> : <Play />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon-lg" 
              onClick={() => setShowSettings(!showSettings)} 
              aria-label={showSettings ? 'Close settings' : 'Open reading and accessibility settings'}
              aria-expanded={showSettings}
            >
              {showSettings ? <Settings /> : <Accessibility />}
            </Button>
          </div>
        </footer>
        
        {/* Progress Celebrations */}
        {celebrationState && (
          <ProgressCelebration
            isOpen={celebrationState.isOpen}
            onClose={handleCelebrationClose}
            type={celebrationState.type}
            title={celebrationState.title}
            message={celebrationState.message}
          />
        )}
      </div>
    </>
  );
};

export default ReadPage;