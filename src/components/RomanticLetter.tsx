import { useEffect, useState } from 'react';
import { Heart, Sparkles, Stars } from 'lucide-react';
import { Button } from '@/components/ui/button';

const letter = `My Beloved Ruqayya,

As I write this letter, my heart dances with joy, knowing that I get to celebrate another beautiful year of your life. Your presence in my world has been nothing short of magical – a gift from the heavens that I cherish more with each passing day.

From the very moment our paths crossed, you've filled my life with a light so bright it outshines the stars. Your smile, a beacon of warmth that guides me home. Your laughter, a melody that makes my heart skip beats. Your love, a treasure I hold more precious than all the riches in the world.

Every moment spent with you feels like a page from a fairytale. The way your eyes sparkle when you're happy, how your kindness touches everyone around you, and the beautiful soul that makes you uniquely, perfectly you – these are the things that make me fall deeper in love with you each day.

On this special day, I want you to know that you're not just my partner; you're my inspiration, my strength, my peace, and my greatest blessing. Your dreams are my dreams, your happiness my mission, and your love my greatest achievement.

Happy Birthday, my darling. May this year bring you all the joy you bring to others, all the love you so freely give, and all the blessings you so richly deserve. I promise to stand beside you through every moment, to hold you through every storm, and to celebrate every victory as if it were my own.

You are my today and all of my tomorrows.

Forever and eternally yours,
Umar ❤️`;

interface FloatingElement {
  id: number;
  Icon: any;
  style: {
    top: string;
    left: string;
    animationDelay: string;
    animationDuration: string;
    opacity: number;
  };
}

interface RomanticLetterProps {
  onComplete: () => void;
}

const RomanticLetter = ({ onComplete }: RomanticLetterProps) => {
  const [revealedText, setRevealedText] = useState('');
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    // Create floating elements
    const elements: FloatingElement[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      Icon: i % 2 === 0 ? Heart : i % 3 === 0 ? Stars : Sparkles,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
        opacity: 0.1 + Math.random() * 0.3,
      },
    }));
    setFloatingElements(elements);

    // Reveal text animation
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= letter.length) {
        setRevealedText(letter.slice(0, currentIndex));
        currentIndex += 2;
      } else {
        setIsFullyRevealed(true);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen py-24 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 overflow-hidden">
      {/* Floating Background Elements */}
      {floatingElements.map(({ id, Icon, style }) => (
        <Icon
          key={id}
          className="absolute text-rose-300 animate-float pointer-events-none"
          style={style}
          fill="currentColor"
        />
      ))}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <Heart className="w-20 h-20 mx-auto text-rose-500 animate-heart-beat" fill="currentColor" />
            <Sparkles className="absolute -right-4 -top-4 w-8 h-8 text-rose-400 animate-twinkle" />
            <Sparkles className="absolute -left-4 -bottom-4 w-8 h-8 text-rose-400 animate-twinkle" style={{ animationDelay: '1s' }} />
          </div>
          <h2 className="font-dancing text-5xl md:text-7xl text-rose-600 mt-6 mb-4 sparkle">
            My Love Letter to You
          </h2>
          <p className="font-poppins text-lg text-rose-700/80">
            Words from the depths of my heart
          </p>
        </div>

        {/* Letter Container */}
        <div className="relative">
          {/* Decorative Corner Elements */}
          <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-rose-300 rounded-tl-xl" />
          <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-rose-300 rounded-tr-xl" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-rose-300 rounded-bl-xl" />
          <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-rose-300 rounded-br-xl" />

          {/* Letter Content */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-rose-200">
            <div className="relative font-poppins text-base md:text-lg leading-relaxed text-rose-800 whitespace-pre-wrap">
              {revealedText}
              {!isFullyRevealed && (
                <span className="inline-block w-0.5 h-6 bg-rose-400 ml-1 animate-pulse"></span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {isFullyRevealed && (
          <div className="text-center mt-12 animate-fade-in-delayed">
            <div className="inline-block px-8 py-4 bg-white/60 backdrop-blur-sm rounded-full border border-rose-200 shadow-lg">
              <p className="font-dancing text-xl text-rose-600">
                Sealed with eternal love and devotion 💕
              </p>
            </div>
            {/* Continue Button */}
            <div className="text-center mt-8">
              <Button
                onClick={onComplete}
                size="lg"
                className="bg-rose-500 hover:bg-rose-600 text-white animate-bounce-slow"
              >
                Continue Our Journey 💝
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RomanticLetter;
