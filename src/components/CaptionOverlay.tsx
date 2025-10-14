import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CaptionOverlayProps {
  liveCaption: string;
  signToTextCaption: string;
  isVoiceToTextOn: boolean;
  isSignToTextOn: boolean;
  translations: {
    liveCaptions: string;
    signLanguage: string;
  };
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  liveCaption,
  signToTextCaption,
  isVoiceToTextOn,
  isSignToTextOn,
  translations
}) => {
  return (
    <>
      <AnimatePresence>
        {(isVoiceToTextOn && liveCaption) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-2xl"
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">{translations.liveCaptions}</div>
              <div className="text-white">{liveCaption}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isSignToTextOn && signToTextCaption) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2"
          >
            <div className="bg-purple-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-600">
              <div className="text-xs text-purple-300 mb-1">{translations.signLanguage}</div>
              <div className="text-white font-medium">{signToTextCaption}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
