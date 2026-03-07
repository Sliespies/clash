'use client';

import { useState, useCallback, useEffect } from 'react';
import SetupScreen from '@/components/SetupScreen';
import EventsScreen from '@/components/EventsScreen';
import Toast from '@/components/Toast';
import { Card } from '@/components/ui';

type Screen = 'setup' | 'events';

const STORAGE_KEY = 'clash-session';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [company, setCompany] = useState('');
  const [userName, setUserName] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { company: c, userName: u } = JSON.parse(saved);
        if (c && u) {
          setCompany(c);
          setUserName(u);
          setScreen('events');
        }
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (company && userName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ company, userName }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [company, userName, ready]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleReset = () => {
    setCompany('');
    setUserName('');
    setScreen('setup');
  };

  if (!ready) return null;

  return (
    <div className="w-full max-w-[520px] px-4 py-8">
      <div className="flex justify-center mb-6">
        <img src="/logo.svg" alt="Clash of the Companies" className="h-24 w-auto" />
      </div>

      <Card>
        {screen === 'setup' && (
          <SetupScreen
            onNext={(c, n) => {
              setCompany(c);
              setUserName(n);
              setScreen('events');
            }}
          />
        )}

        {screen === 'events' && (
          <EventsScreen
            company={company}
            userName={userName}
            onDone={handleReset}
            onBack={handleReset}
            showToast={showToast}
          />
        )}
      </Card>

      <Toast message={toastMsg} visible={toastVisible} onHide={hideToast} />
    </div>
  );
}
