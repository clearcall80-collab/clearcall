import React from 'react';

export function TeluguPattern() {
  return (
    <div className="relative overflow-hidden">
      {/* Telugu-inspired thoranam/rangoli pattern */}
      <div className="flex justify-center items-center py-4">
        <svg
          width="300"
          height="40"
          viewBox="0 0 300 40"
          className="text-blue-400/30 dark:text-blue-300/20"
          fill="currentColor"
        >
          {/* Traditional thoranam-inspired pattern */}
          <defs>
            <pattern id="teluguPattern" x="0" y="0" width="50" height="40" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="20" r="3" opacity="0.6" />
              <path d="M15 20 Q25 10 35 20 Q25 30 15 20 Z" opacity="0.4" />
              <circle cx="10" cy="20" r="1.5" opacity="0.8" />
              <circle cx="40" cy="20" r="1.5" opacity="0.8" />
            </pattern>
          </defs>
          
          {/* Main decorative elements */}
          <g>
            {/* Central lotus-inspired motif */}
            <path d="M150 20 Q140 10 130 20 Q140 30 150 20 Q160 10 170 20 Q160 30 150 20 Z" opacity="0.5" />
            <circle cx="150" cy="20" r="4" opacity="0.7" />
            
            {/* Side decorative elements */}
            <g transform="translate(-30, 0)">
              <path d="M120 20 Q115 15 110 20 Q115 25 120 20 Z" opacity="0.4" />
              <circle cx="115" cy="20" r="2" opacity="0.6" />
            </g>
            
            <g transform="translate(60, 0)">
              <path d="M180 20 Q185 15 190 20 Q185 25 180 20 Z" opacity="0.4" />
              <circle cx="185" cy="20" r="2" opacity="0.6" />
            </g>
            
            {/* Outer decorative dots */}
            <g opacity="0.3">
              <circle cx="80" cy="20" r="1" />
              <circle cx="90" cy="15" r="1" />
              <circle cx="90" cy="25" r="1" />
              <circle cx="210" cy="15" r="1" />
              <circle cx="210" cy="25" r="1" />
              <circle cx="220" cy="20" r="1" />
            </g>
            
            {/* Connecting lines */}
            <g opacity="0.2" stroke="currentColor" strokeWidth="1" fill="none">
              <path d="M100 20 Q125 15 150 20 Q175 15 200 20" />
              <path d="M100 20 Q125 25 150 20 Q175 25 200 20" />
            </g>
          </g>
          
          {/* Repeating pattern overlay */}
          <rect width="300" height="40" fill="url(#teluguPattern)" opacity="0.1" />
        </svg>
      </div>
      
      {/* Additional decorative border */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent dark:via-blue-300/20"></div>
    </div>
  );
}