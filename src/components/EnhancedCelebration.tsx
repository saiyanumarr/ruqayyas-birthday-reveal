import { useEffect, useState, useRef } from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface EnhancedCelebrationProps {
  onComplete: () => void;
}

const EnhancedCelebration = ({ onComplete }: EnhancedCelebrationProps) => {
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [cakeClicked, setCakeClicked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrame = useRef<number>();
  const micStream = useRef<MediaStream | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  // Optimize animations by using requestAnimationFrame
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        // Animation logic here
        animationFrame.current = requestAnimationFrame(animate);
      };
      animationFrame.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isAnimating]);

  useEffect(() => {
    // Play celebration sound
    try {
      audioRef.current = new Audio('/celebration.mp3');
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    } catch (error) {}

    setTimeout(() => setShowText(true), 500);
    setTimeout(() => setShowButton(true), 3000);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (micStream.current) {
        micStream.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const handleCakeClick = async () => {
    try {
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      }

      if (!isListening) {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.current = stream;
        
        // Set up audio analysis
        if (audioContext) {
          const micSource = audioContext.createMediaStreamSource(stream);
          const newAnalyser = audioContext.createAnalyser();
          analyser.current = newAnalyser;
          micSource.connect(newAnalyser);
          
          // Configure analyser
          newAnalyser.fftSize = 256;
          const bufferLength = newAnalyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          // Start monitoring volume
          const checkVolume = () => {
            if (!analyser.current) return;
            
            analyser.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            // If loud enough, consider it as blowing
            if (average > 100) { // Adjust threshold as needed
              handleCandle();
              return;
            }
            
            // Continue checking if not triggered
            if (!cakeClicked) {
              requestAnimationFrame(checkVolume);
            }
          };
          
          checkVolume();
          setIsListening(true);
        }
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Fallback to click interaction
      handleCandle();
    }
  };

  const handleCandle = () => {
    // Clean up audio context
    if (micStream.current) {
      micStream.current.getTracks().forEach(track => track.stop());
      micStream.current = null;
    }
    if (analyser.current) {
      analyser.current.disconnect();
      analyser.current = null;
    }
    setIsListening(false);

    // Trigger celebration
    setCakeClicked(true);
    setTimeout(() => {
      onComplete();
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Night Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at top, transparent 0%, #000),
                           radial-gradient(ellipse at bottom, #000, rgba(145, 233, 255, 0.2))`,
        }}></div>
      </div>

      {/* Glowing Flowers */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end gap-8 pb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative" style={{ 
            animation: `flower-sway-${i} 4s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`
          }}>
            {/* Flower Stem */}
            <div className="w-1 bg-gradient-to-t from-green-600 to-green-400 mx-auto" style={{
              height: `${60 + i * 10}vmin`,
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
            }}>
              {/* Leaves */}
              {[...Array(6)].map((_, leafIdx) => (
                <div key={leafIdx} className="absolute w-8 h-4 bg-green-500 rounded-full" style={{
                  top: `${15 + leafIdx * 12}%`,
                  left: leafIdx % 2 === 0 ? '-20px' : '5px',
                  transform: `rotate(${leafIdx % 2 === 0 ? -45 : 45}deg)`,
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                  animation: `leaf-grow 0.5s ${1.5 + leafIdx * 0.2}s backwards`
                }}></div>
              ))}
            </div>

            {/* Flower Head */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              <div className="relative w-24 h-24">
                {/* Petals */}
                {[...Array(8)].map((_, petalIdx) => (
                  <div key={petalIdx} className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full" style={{
                    background: `radial-gradient(circle, hsl(${i * 60 + petalIdx * 15}, 100%, 70%), hsl(${i * 60 + petalIdx * 15}, 100%, 50%))`,
                    transform: `translate(-50%, -50%) rotate(${petalIdx * 45}deg) translateY(-20px)`,
                    boxShadow: `0 0 20px hsl(${i * 60 + petalIdx * 15}, 100%, 60%)`,
                    animation: `petal-bloom 0.6s ${2 + petalIdx * 0.1}s backwards, petal-glow 2s ease-in-out infinite`,
                    animationDelay: `${2 + petalIdx * 0.1}s, ${2.6 + petalIdx * 0.1}s`
                  }}></div>
                ))}
                
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cream shadow-lg" style={{
                  boxShadow: '0 0 30px rgba(255, 248, 220, 0.8)',
                  animation: 'center-glow 2s ease-in-out infinite 2.8s'
                }}></div>

                {/* Glowing Particles */}
                {[...Array(8)].map((_, lightIdx) => (
                  <div key={lightIdx} className="absolute w-2 h-2 rounded-full bg-cream" style={{
                    top: '50%',
                    left: '50%',
                    boxShadow: '0 0 15px rgba(255, 248, 220, 0.9)',
                    animation: `particle-float 3s ease-in-out infinite`,
                    animationDelay: `${3 + lightIdx * 0.3}s`,
                    transform: `translate(-50%, -50%) rotate(${lightIdx * 45}deg) translateY(0)`
                  }}></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div key={i} className="absolute animate-confetti rounded-sm" style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            width: `${Math.random() * 12 + 4}px`,
            height: `${Math.random() * 12 + 4}px`,
            backgroundColor: ['#FFB6C1', '#FFD700', '#F4C2C2', '#FFF8F0', '#FF69B4', '#00CED1', '#FF6347'][Math.floor(Math.random() * 7)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}></div>
        ))}
      </div>

      {/* Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <Sparkles key={i} className="absolute text-cream animate-sparkle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${Math.random() * 35 + 15}px`,
          }}/>
        ))}
      </div>

      {/* Floating Hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <Heart key={i} className="absolute text-cream/70 animate-float" fill="currentColor" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            fontSize: `${Math.random() * 50 + 10}px`,
          }}/>
        ))}
      </div>

      {/* Firework Bursts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute animate-pulse-glow rounded-full" style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            width: `${Math.random() * 120 + 40}px`,
            height: `${Math.random() * 120 + 40}px`,
            background: `radial-gradient(circle, hsl(${Math.random() * 360} 100% 70% / 0.7) 0%, transparent 70%)`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
          }}></div>
        ))}
      </div>

      {/* Main Message */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto mt-20">
        <div className={`transition-all duration-1000 ${showText ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <h1 className="font-dancing text-6xl md:text-8xl lg:text-9xl text-cream mb-8 animate-heart-beat drop-shadow-2xl leading-tight">
            Happy Birthday,
            <br />
            Ruqayya 💖
          </h1>

          {showText && (
            <div className="mb-12 animate-fade-in-delayed">
              <p className="font-poppins text-2xl text-cream/90 leading-relaxed">
                Today we celebrate the most beautiful soul in my world.
                Your existence is a blessing, your love a precious gift.
                May this birthday be as magical as you make every moment of my life.
              </p>
            </div>
          )}

          {/* Interactive Birthday Cake */}
          {showButton && !cakeClicked && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleCakeClick}
                className="relative group cursor-pointer transform hover:scale-105 transition-transform duration-300"
              >
                <div className="relative w-48 h-48 bg-gradient-to-b from-cream/90 to-cream rounded-3xl shadow-2xl overflow-hidden border-4 border-cream/50"
                  style={{ 
                    boxShadow: '0 0 40px rgba(255, 248, 220, 0.6), 0 20px 60px rgba(0, 0, 0, 0.3)' 
                  }}
                >
                  {/* Cake Layers */}
                  <div className="absolute bottom-0 left-0 right-0">
                    <div className="h-16 bg-gradient-to-r from-rose-blush via-rose-gold to-primary rounded-t-2xl border-t-4 border-cream"></div>
                    <div className="h-16 bg-gradient-to-r from-primary via-rose-gold to-rose-blush border-t-4 border-cream"></div>
                  </div>

                  {/* Frosting Drips */}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute top-20 w-8 h-12 bg-cream rounded-b-full" style={{
                      left: `${i * 16 + 8}%`,
                      animation: `drip 0.8s ease-out ${i * 0.1}s backwards`
                    }}></div>
                  ))}

                  {/* Sprinkles */}
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="absolute w-1.5 h-3 rounded-full" style={{
                      backgroundColor: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#9370DB'][Math.floor(Math.random() * 5)],
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 50}%`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                      animation: `sprinkle-appear 0.3s ${2 + i * 0.02}s backwards`
                    }}></div>
                  ))}

                  {/* Birthday Message on Cake */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                    <p className="font-dancing text-lg text-rose-600 font-bold whitespace-nowrap">
                      Happy Birthday
                    </p>
                  </div>

                  {/* Candle */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <div className="w-3 h-16 bg-gradient-to-b from-cream to-cream/80 rounded-full shadow-lg"></div>
                    {/* Flame */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <div className="relative">
                        <div className="w-4 h-8 bg-gradient-to-t from-yellow-500 via-orange-500 to-red-500 rounded-full animate-flame-flicker"
                          style={{ 
                            filter: 'blur(2px)',
                            boxShadow: '0 0 30px rgba(255, 165, 0, 0.8)' 
                          }}
                        ></div>
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-4 bg-gradient-to-t from-yellow-300 to-transparent rounded-full animate-flame-flicker"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-yellow-300/30 via-transparent to-transparent animate-pulse-glow"></div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <p className="font-dancing text-2xl text-cream animate-pulse">
                    Make a wish! 🌟
                  </p>
                  <p className="font-poppins text-sm text-cream/80">
                    Click to blow the candle
                  </p>
                </div>
              </button>
            </div>
          )}

          {cakeClicked && (
            <div className="animate-fade-in-up mt-12 space-y-6">
              <p className="font-dancing text-3xl text-cream">
                May all your wishes come true! 💫
              </p>
              <div 
                className="inline-flex items-center gap-3 px-8 py-4 bg-cream/20 backdrop-blur-md rounded-full border-2 border-cream/40 shadow-lg hover:bg-cream/30 transition-all cursor-pointer group"
                onClick={onComplete}
              >
                <span className="font-poppins text-cream font-medium text-lg">
                  Continue to your final surprise
                </span>
                <span className="text-cream text-xl group-hover:translate-x-1 transition-transform">
                  ✨
                </span>
              </div>
            </div>
          )}
        </div>
      </div>      <style>{`
        @keyframes flower-sway-1 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes flower-sway-2 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-3deg); }
        }
        @keyframes flower-sway-3 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes leaf-grow {
          from { transform: scale(0) rotate(var(--rotation, 0deg)); opacity: 0; }
          to { transform: scale(1) rotate(var(--rotation, 0deg)); opacity: 1; }
        }
        @keyframes petal-bloom {
          from { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(0) scale(0); }
          to { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(-20px) scale(1); }
        }
        @keyframes petal-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes center-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 248, 220, 0.8); }
          50% { box-shadow: 0 0 50px rgba(255, 248, 220, 1); }
        }
        @keyframes particle-float {
          0% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) translateY(-40px); opacity: 0; }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.1) scaleX(0.95); }
        }
        @keyframes drip {
          from { transform: scaleY(0); transform-origin: top; }
          to { transform: scaleY(1); transform-origin: top; }
        }
        @keyframes sprinkle-appear {
          from { transform: scale(0) rotate(0deg); opacity: 0; }
          to { transform: scale(1) rotate(var(--rotation, 0deg)); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedCelebration;
