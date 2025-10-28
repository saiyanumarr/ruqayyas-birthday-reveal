import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Sparkles, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface CountdownSectionProps {
  onComplete: () => void;
}

// Set your target date here
const targetDate = new Date('2025-11-12T00:00:00');

const CountdownSection: React.FC<CountdownSectionProps> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isComplete, setIsComplete] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        setIsComplete(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isComplete && !showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showMessage, onComplete]);

  return (
    <section className="relative min-h-screen py-24 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 overflow-hidden">
      {/* Floating Elements */}
      {[...Array(20)].map((_, i) => {
        const Icon = i % 3 === 0 ? Heart : i % 2 === 0 ? Star : Sparkles;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: i * 0.1 }}
            className="absolute pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            <Icon
              className="w-6 h-6 text-rose-300 animate-float"
              style={{
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
              fill="currentColor"
            />
          </motion.div>
        );
      })}

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <div className="inline-block relative">
                  <Clock className="w-20 h-20 text-rose-500 animate-pulse-slow" strokeWidth={1.5} />
                  <Sparkles className="absolute -right-4 -top-4 w-8 h-8 text-rose-400 animate-twinkle" />
                </div>
                <h2 className="font-dancing text-5xl md:text-7xl text-rose-600 sparkle">
                  Counting Down to Magic
                </h2>
                <p className="font-poppins text-lg text-rose-700/80 max-w-2xl mx-auto">
                  Every second brings us closer to your special day
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(timeLeft).map(([unit, value], index) => (
                  <motion.div
                    key={unit}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-rose-200 group hover:shadow-rose-200/50 transition-all duration-500">
                      <div className="font-poppins text-4xl md:text-5xl font-bold text-rose-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                        {value.toString().padStart(2, '0')}
                      </div>
                      <div className="font-dancing text-xl text-rose-500 capitalize">
                        {unit}
                      </div>
                    </div>
                    <Heart
                      className="absolute -top-2 -right-2 w-6 h-6 text-rose-400 animate-heart-beat"
                      fill="currentColor"
                    />
                  </motion.div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <div className="h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent max-w-sm mx-auto" />
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-50 px-4">
                    <Heart className="w-6 h-6 text-rose-400" fill="currentColor" />
                  </div>
                </div>
                
                <p className="font-dancing text-2xl text-rose-600/80 animate-pulse-slow">
                  Until we celebrate the most beautiful soul...
                </p>

                <div className="flex justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-400 animate-twinkle" />
                  <p className="font-poppins text-rose-700/60 italic">
                    Your birthday will be magical
                  </p>
                  <Sparkles className="w-5 h-5 text-rose-400 animate-twinkle" style={{ animationDelay: '1s' }} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Heart className="w-32 h-32 mx-auto text-rose-500 animate-heart-beat" fill="currentColor" />
              </motion.div>

              <div className="space-y-4">
                <h2 className="font-dancing text-6xl text-rose-600">
                  It's Time!
                </h2>
                <p className="font-poppins text-xl text-rose-700">
                  Get ready for something magical...
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={onComplete}
                  variant="default"
                  size="lg"
                  className="animate-bounce-slow"
                >
                  Reveal Your Birthday Surprise ✨
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CountdownSection;
