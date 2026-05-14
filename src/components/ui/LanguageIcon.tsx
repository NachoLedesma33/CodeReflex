import React from 'react';
import { cn } from '@/lib/utils';

interface LanguageIconProps {
  language: string;
  className?: string;
  size?: number | string;
}

export function LanguageIcon({ language, className, size = 20 }: LanguageIconProps) {
  const lang = language.toLowerCase();

  const renderIcon = () => {
    switch (lang) {
      case 'javascript':
      case 'js':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#js-gradient)" />
            <path
              d="M7 16.5C7 17.3 7.7 18 8.5 18C9.3 18 10 17.3 10 16.5V11H11.5V16.5C11.5 18.2 10.2 19.5 8.5 19.5C6.8 19.5 5.5 18.2 5.5 16.5V15H7V16.5Z"
              fill="black"
              fillOpacity="0.9"
            />
            <path
              d="M13 17.5H16.5C17.3 17.5 18 16.8 18 16V15C18 14.2 17.3 13.5 16.5 13.5H14.5C14.2 13.5 14 13.3 14 13V12.5C14 12.2 14.2 12 14.5 12H18V10.5H14.5C13.7 10.5 13 11.2 13 12V13C13 13.8 13.7 14.5 14.5 14.5H16.5C16.8 14.5 17 14.7 17 15V15.5C17 15.8 16.8 16 16.5 16H13V17.5Z"
              fill="black"
              fillOpacity="0.9"
            />
            <defs>
              <linearGradient id="js-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F7DF1E" />
                <stop offset="1" stopColor="#F0DB4F" />
              </linearGradient>
            </defs>
          </svg>
        );
      case 'typescript':
      case 'ts':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#ts-gradient)" />
            <path
              d="M10 10.5H6V12.5H7.25V18H9.25V12.5H10.5V10.5H10Z"
              fill="white"
            />
            <path
              d="M12.5 17.5H16.5C17.3 17.5 18 16.8 18 16V15C18 14.2 17.3 13.5 16.5 13.5H14.5C14.2 13.5 14 13.3 14 13V12.5C14 12.2 14.2 12 14.5 12H18V10.5H14.5C13.7 10.5 13 11.2 13 12V13C13 13.8 13.7 14.5 14.5 14.5H16.5C16.8 14.5 17 14.7 17 15V15.5C17 15.8 16.8 16 16.5 16H12.5V17.5Z"
              fill="white"
            />
            <defs>
              <linearGradient id="ts-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3178C6" />
                <stop offset="1" stopColor="#235A97" />
              </linearGradient>
            </defs>
          </svg>
        );
      case 'python':
      case 'py':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C9.2 2 7 4.2 7 7V9H12V10H5C3.3 10 2 11.3 2 13V17C2 18.7 3.3 20 5 20H7V18C7 16.3 8.3 15 10 15H14C15.7 15 17 13.7 17 12V8C17 5.2 14.8 3 12 3H10V2H12Z"
              fill="url(#py-blue-gradient)"
            />
            <path
              d="M12 22C14.8 22 17 19.8 17 17V15H12V14H19C20.7 14 22 12.7 22 11V7C22 5.3 20.7 4 19 4H17V6C17 7.7 15.7 9 14 9H10C8.3 9 7 10.3 7 12V16C7 18.8 9.2 21 12 21H14V22H12Z"
              fill="url(#py-yellow-gradient)"
            />
            <circle cx="9.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9" />
            <circle cx="14.5" cy="18.5" r="1.2" fill="white" fillOpacity="0.9" />
            <defs>
              <linearGradient id="py-blue-gradient" x1="2" y1="2" x2="17" y2="15" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3776AB" />
                <stop offset="1" stopColor="#2B5B87" />
              </linearGradient>
              <linearGradient id="py-yellow-gradient" x1="22" y1="22" x2="7" y2="9" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD43B" />
                <stop offset="1" stopColor="#FFE873" />
              </linearGradient>
            </defs>
          </svg>
        );
      case 'java':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 13.5C15 13.5 18 13.5 18 11.5C18 9.5 15 9.5 15 9.5V13.5Z"
              stroke="url(#java-gradient)"
              strokeWidth="2"
            />
            <path
              d="M6 9H15V13C15 15 13.5 16.5 11.5 16.5H9.5C7.5 16.5 6 15 6 13V9Z"
              fill="url(#java-gradient)"
            />
            <path
              d="M4 19.5C4 19.5 7 21.5 12 21.5C17 21.5 20 19.5 20 19.5"
              stroke="url(#java-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 6.5C10 6.5 8.5 5 10 3"
              stroke="#EA2D2E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M13 7.5C13 7.5 11.5 5.5 13 4"
              stroke="#EA2D2E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="java-gradient" x1="4" y1="9" x2="20" y2="21.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#007396" />
                <stop offset="1" stopColor="#5382A1" />
              </linearGradient>
            </defs>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn('flex-shrink-0 flex items-center justify-center overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      {renderIcon()}
    </div>
  );
}
