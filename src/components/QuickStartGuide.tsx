import { useState } from 'react';
import { X, Video, Users, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface QuickStartGuideProps {
  language: 'en' | 'te';
  onDismiss: () => void;
}

export function QuickStartGuide({ language, onDismiss }: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const translations = {
    en: {
      quickStart: "Quick Start Guide",
      step1Title: "Start Instant Calls",
      step1Desc: "Click 'Start Call' to create an instant room and get a shareable code",
      step2Title: "Join Meetings",
      step2Desc: "Use 'Join Room' to enter a 6-digit code and join others",
      step3Title: "Schedule Ahead",
      step3Desc: "Plan meetings with Calendar and send invites to contacts",
      next: "Next",
      previous: "Previous",
      gotIt: "Got it!",
      dismiss: "Dismiss"
    },
    te: {
      quickStart: "శీఘ్ర ప్రారంభ గైడ్",
      step1Title: "తక్షణ కాల్స్ ప్రారంభించండి",
      step1Desc: "తక్షణ రూమ్ సృష్టించడానికి మరియు షేర్ చేయగల కోడ్ పొందడానికి 'కాల్ ప్రారంభించండి'ని క్లిక్ చేయండి",
      step2Title: "మీటింగ్‌లలో చేరండి",
      step2Desc: "6-అంకెల కోడ్ నమోదు చేయడానికి మరియు ఇతరులతో చేరడానికి 'రూమ్‌లో చేరండి'ని ఉపయోగించండి",
      step3Title: "ముందుగా షెడ్యూల్ చేయండి",
      step3Desc: "క్యాలెండర్‌తో మీటింగ్‌లను ప్లాన్ చేయండి మరియు పరిచయాలకు ఆహ్వానాలు పంపండి",
      next: "తదుపరి",
      previous: "మునుపటి",
      gotIt: "అర్థమైంది!",
      dismiss: "తీసివేయండి"
    }
  };

  const t = translations[language];

  const steps = [
    {
      title: t.step1Title,
      description: t.step1Desc,
      icon: Video,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: t.step2Title,
      description: t.step2Desc,
      icon: Users,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      title: t.step3Title,
      description: t.step3Desc,
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.quickStart}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-lg ${currentStepData.color} flex-shrink-0`}>
                <currentStepData.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {currentStepData.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-blue-600'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  {t.previous}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`${currentStep === 0 ? 'w-full' : 'flex-1'} bg-blue-600 hover:bg-blue-700`}
              >
                {currentStep === steps.length - 1 ? t.gotIt : t.next}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}