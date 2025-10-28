import { useState, useCallback } from 'react';
import FullscreenGate from '@/components/FullscreenGate';
import AuthGate from '@/components/AuthGate';
import BlackoutTransition from '@/components/BlackoutTransition';
import DiwaliFireworks from '@/components/DiwaliFireworks';
import HeroSection from '@/components/HeroSection';
import CountdownSection from '@/components/CountdownSection';
import MemoryLane from '@/components/MemoryLane';
import StoryGallery from '@/components/StoryGallery';
import EnhancedCelebration from '@/components/EnhancedCelebration';
import RomanticLetter from '@/components/RomanticLetter';

type Stage = 
  | 'fullscreen' 
  | 'auth' 
  | 'blackout' 
  | 'fireworks' 
  | 'hero'
  | 'countdown'
  | 'memories'
  | 'gallery'
  | 'celebration'
  | 'letter'
  | 'done';

const Index = () => {
  const [stage, setStage] = useState<Stage>('fullscreen');

  const handleFullscreenComplete = () => setStage('auth');
  const handleAuthenticated = () => setStage('blackout');
  const handleBlackoutComplete = () => setStage('fireworks');
  const handleFireworksComplete = useCallback(() => {
    console.log('Fireworks complete, moving to hero stage');
    setStage('hero');
  }, []);
  const handleHeroComplete = () => setStage('countdown');
  const handleCountdownComplete = () => setStage('memories');
  const handleMemoriesComplete = () => setStage('gallery');
  const handleGalleryComplete = () => setStage('celebration');
  const handleCelebrationComplete = () => setStage('letter');
  const handleLetterComplete = () => setStage('done');

  if (stage === 'fullscreen') return <FullscreenGate onFullscreen={handleFullscreenComplete} />;
  if (stage === 'auth') return <AuthGate onAuthenticated={handleAuthenticated} />;
  if (stage === 'blackout') return <BlackoutTransition onComplete={handleBlackoutComplete} />;
  if (stage === 'fireworks') return <DiwaliFireworks onComplete={handleFireworksComplete} />;
  if (stage === 'hero') return <HeroSection onComplete={handleHeroComplete} />;
  if (stage === 'countdown') return <CountdownSection onComplete={handleCountdownComplete} />;
  if (stage === 'memories') return <MemoryLane onComplete={handleMemoriesComplete} />;
  if (stage === 'gallery') return <StoryGallery onComplete={handleGalleryComplete} />;
  if (stage === 'celebration') return <EnhancedCelebration onComplete={handleCelebrationComplete} />;
  if (stage === 'letter') return <RomanticLetter onComplete={handleLetterComplete} />;

  if (stage === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
        <div className="text-center px-6">
          <h1 className="font-dancing text-5xl md:text-7xl text-rose-600 mb-6">
            Thank You for Being Mine 💝
          </h1>
          <p className="font-poppins text-lg md:text-xl text-rose-700/80 max-w-2xl mx-auto">
            Every moment with you is a gift, and I cherish them all. Happy Birthday, my love!
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
