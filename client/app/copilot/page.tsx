'use client'
import { useEffect, useState, useRef } from 'react'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}



export default function CopilotPage() {

  const [questions, setQuestions] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const raw = sessionStorage.getItem('copilotQuestions');
      console.log('raw from sessionStorage:', raw);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setQuestions(parsed);
      }
    }, 500); // wait 500ms for sessionStorage to be set
    return () => clearTimeout(timer);
  }, []);


  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const router = useRouter();


  const goToPostConsultation = () => {
    sessionStorage.setItem('consultationText', text);
    router.push('/post-consultation-results');
  };



  const startListening = () => {
    accumulatedTextRef.current = '';
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = 'en-US';

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    recognizerRef.current = recognizer;

    recognizer.recognizing = (s, e) => {

      setText(accumulatedTextRef.current + ' ' + e.result.text);
    };

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        accumulatedTextRef.current += ' ' + e.result.text;
        setText(accumulatedTextRef.current);
      }
    };

    recognizer.startContinuousRecognitionAsync();
    setIsListening(true);
  };

  const stopListening = () => {
    recognizerRef.current?.stopContinuousRecognitionAsync();
    setIsListening(false);
  };

  useEffect(() => {
    // Strip everything the root layout adds
    document.body.style.cssText = `
      background: transparent !important;
      background-image: none !important;
      padding: 0 !important;
      margin: 0 !important;
    `
    // Hide navbar
    const nav = document.querySelector('nav') as HTMLElement
    if (nav) nav.style.display = 'none'

    return () => {
      document.body.style.cssText = ''
      const nav = document.querySelector('nav') as HTMLElement
      if (nav) nav.style.display = ''
    }
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      padding: 40,
      boxSizing: 'border-box',
    }}>
      {/* This is the visible floating card */}
      <div style={{
        width: '100%',
        height: '100%',
        background: 'rgba(5, 14, 31, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 16,
        border: '1px solid rgba(96, 165, 250, 0.2)',
        overflow: 'hidden',
        // Makes the whole window draggable
        WebkitAppRegion: 'drag' as any,
      }}>

        {/* Drag handle / title bar */}
        <div style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(96,165,250,0.1)',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' }}>
            COPILOT
          </span>
          <div className="flex gap-2 items-center justify-center">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-3 py-2 rounded-2xl text-base font-medium
                       transition-all place-self-end duration-200 cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-offset-2
                       ${isListening
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                  : 'bg-[#004aa4] hover:scale-105 focus:ring-purple-500'} 
                       text-white`}
              style={{ WebkitAppRegion: 'no-drag' as any }}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
            <button
              onClick={() => (window as any).electronAPI.closeCopilot(text)}
              style={{
                WebkitAppRegion: 'no-drag' as any,
                background: 'rgba(239,68,68)',
                border: '1px solid ',
                borderRadius: 6,
                color: 'rgba(0,0,0)',
                cursor: 'pointer',
                padding: '2px 10px',
                fontSize: 20,
              }}>
              ✕
            </button>
          </div>
        </div>

        {/* Content — must be no-drag so clicks work */}
        <div className='grid grid-row-2 overflow-y-scroll' style={{ WebkitAppRegion: 'no-drag' as any, padding: 16, height: 'calc(100% - 40px)', overflowY: 'auto' }}>



          {/* ------- Speech recognition -------- */}
          <div className="text-white flex flex-col">




            <div className="relative">
              <div
                className="w-full min-h-50 p-4 border-2 border-purple-200 rounded-lg
                       text-xl"
              >
                {text || 'Waiting for audio input...'}
              </div>

              {isListening && (
                <div className="absolute top-2 right-2">
                  <div className="animate-pulse w-3 h-3 rounded-full bg-purple-500" />
                </div>
              )}
            </div>

            <button
              onClick={goToPostConsultation}
              className="relative overflow-hidden px-5 py-3 my-5 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.4) 100%)",
                border: "1px solid rgba(96,165,250,0.35)",
              }}>
              Summarize meeting
            </button>
          </div>

          {/* -------- Questions -------- */}

          <div className="border-t pt-5 border-white text-white overflow-y-scroll">
            <div className="text-gray-500">Questions to ask your doctor</div>
            {
              questions && questions.map((question, key) => (
                <div key={key} className="flex gap-2 items-center justify-start my-2 border p-2 rounded-md"><input type='checkbox' className="" /><span>{question}</span></div>
              ))
            }
          </div>

        </div>



      </div>
    </div>
  )
}