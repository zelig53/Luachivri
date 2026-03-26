import { useState, useEffect, useMemo, useCallback } from 'react';
import { calculateZmanim } from './lib/zmanim';
import { useLocation } from './hooks/useLocation';
import { DailyDetail } from './components/DailyDetail';
import { HebrewCalendarGrid } from './components/HebrewCalendar';
import { SettingsView } from './components/SettingsView';
import { TimesView } from './components/TimesView';
import { AddTaskModal } from './components/AddTaskModal';
import { Loader2, MapPin, LogIn, LogOut, RefreshCw, Calendar as CalendarIcon, Clock, Settings, Crown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { db, GoogleEvent, GoogleTask } from './lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { calculateHebrewRecurrenceDates } from './lib/recurrence';

type View = 'calendar' | 'times' | 'settings';

export default function App() {
  console.log("App rendering...");
  const { latitude, longitude, error: locError, loading: locationLoading, updateLocation } = useLocation();
  const [activeView, setActiveView] = useState<View>('calendar');
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dexie Queries
  const allEvents = useLiveQuery(() => db.events.toArray()) || [];
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAuth(data.isAuthenticated);
    } catch (e) {
      console.error("Auth check failed", e);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') checkAuth();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuth]);

  const handleLogin = async () => {
    const res = await fetch('/api/auth/google/url');
    const { url } = await res.json();
    window.open(url, 'google_auth', 'width=600,height=700');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuth(false);
    await db.events.clear();
    await db.tasks.clear();
  };

  const syncData = async () => {
    if (!isAuth) return;
    setIsSyncing(true);
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        fetch('/api/google/calendar/events'),
        fetch('/api/google/tasks')
      ]);
      const eventsData = await eventsRes.json();
      const tasksData = await tasksRes.json();
      await db.transaction('rw', db.events, db.tasks, async () => {
        await db.events.bulkPut(eventsData.items || []);
        await db.tasks.bulkPut(tasksData.items || []);
      });
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuth) syncData();
  }, [isAuth]);

  // Today logic with sunset awareness
  const handleGoToToday = useCallback(() => {
    const now = new Date();
    if (typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude)) {
      try {
        const data = calculateZmanim(now, latitude, longitude, 0, undefined, true);
        if (data.isNextDay) {
          const tomorrow = new Date();
          tomorrow.setDate(now.getDate() + 1);
          setViewDate(tomorrow);
          setSelectedDate(tomorrow);
          return;
        }
      } catch (e) {
        console.error("Today calculation failed", e);
      }
    }
    setViewDate(now);
    setSelectedDate(now);
  }, [latitude, longitude]);

  const handleSaveTask = async (task: { 
    title: string; 
    date: Date; 
    time: string; 
    type: 'task' | 'event';
    hebrewRecurrence?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      endDate: Date;
    }
  }) => {
    try {
      const seriesId = task.hebrewRecurrence ? crypto.randomUUID() : undefined;
      const dates = task.hebrewRecurrence 
        ? calculateHebrewRecurrenceDates(task.date, task.hebrewRecurrence.endDate, task.hebrewRecurrence.frequency)
        : [task.date];

      const itemsToSave: (GoogleEvent | GoogleTask)[] = [];

      for (const itemDate of dates) {
        if (task.type === 'task') {
          const newTask: GoogleTask = {
            id: crypto.randomUUID(),
            title: task.title,
            notes: `זמן: ${task.time}`,
            due: itemDate.toISOString(),
            status: 'needsAction',
            seriesId
          };
          itemsToSave.push(newTask);
        } else {
          const startDateTime = new Date(`${format(itemDate, 'yyyy-MM-dd')}T${task.time}:00`);
          const newEvent: GoogleEvent = {
            id: crypto.randomUUID(),
            summary: task.title,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: startDateTime.toISOString() },
            seriesId
          };
          itemsToSave.push(newEvent);
        }
      }

      await db.transaction('rw', db.events, db.tasks, async () => {
        if (task.type === 'task') {
          await db.tasks.bulkAdd(itemsToSave as GoogleTask[]);
        } else {
          await db.events.bulkAdd(itemsToSave as GoogleEvent[]);
        }
      });

      if (isAuth) {
        // Bulk sync to Google Calendar/Tasks
        const endpoint = task.type === 'task' ? '/api/google/tasks/bulk' : '/api/google/calendar/events/bulk';
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToSave })
        }).catch(e => console.error("Background bulk sync failed", e));
      }
    } catch (e) {
      console.error("Failed to save", e);
      throw e;
    }
  };

  const currentZmanim = useMemo(() => {
    if (typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude)) {
      const cleanDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate());
      try {
        return calculateZmanim(cleanDate, latitude, longitude, 0, undefined, false).zmanim;
      } catch (e) {
        console.error("Current zmanim calculation failed", e);
        return [];
      }
    }
    return [];
  }, [viewDate, latitude, longitude]);

  const selectedZmanim = useMemo(() => {
    if (selectedDate && typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude)) {
      const cleanDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      try {
        return calculateZmanim(cleanDate, latitude, longitude, 0, undefined, false);
      } catch (e) {
        console.error("Selected zmanim calculation failed", e);
        return null;
      }
    }
    return null;
  }, [selectedDate, latitude, longitude]);

  const renderView = () => {
    if (locationLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-chabad-blue" size={40} />
          <p className="text-gray-500 font-black text-sm uppercase tracking-widest">מאתר מיקום...</p>
        </div>
      );
    }

    if (locError) {
      return (
        <div className="bg-red-50 border border-red-100 p-8 rounded-[40px] text-center">
          <MapPin className="mx-auto text-red-400 mb-4" size={48} />
          <h3 className="text-red-800 font-black text-xl mb-2">שגיאת מיקום</h3>
          <p className="text-red-600 mb-6 font-bold">{locError}</p>
          <button 
            onClick={() => updateLocation()}
            className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            נסה שוב
          </button>
        </div>
      );
    }

    switch (activeView) {
      case 'times':
        return <TimesView zmanim={currentZmanim} date={viewDate} />;
      case 'settings':
        return (
          <SettingsView 
            onUpdateLocation={updateLocation} 
            onLogout={handleLogout}
            isAuth={isAuth}
          />
        );
      default:
        return (
          <HebrewCalendarGrid 
            currentDate={viewDate}
            selectedDate={selectedDate || new Date()}
            onDateSelect={setSelectedDate}
            onMonthChange={setViewDate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-chabad-blue rounded-lg flex items-center justify-center overflow-hidden shadow-inner">
               <img src="https://picsum.photos/seed/chabadsync/64/64" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="font-black text-xl tracking-tight text-chabad-blue">ChabadSync</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAuth && (
              <button 
                onClick={syncData}
                disabled={isSyncing}
                className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isSyncing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} className="text-chabad-blue" />
              </button>
            )}
            <button 
              onClick={isAuth ? handleLogout : handleLogin}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isAuth ? <LogOut size={20} className="text-red-500" /> : <LogIn size={20} className="text-chabad-blue" />}
            </button>
          </div>
        </header>

        <main className="container mx-auto max-w-2xl px-4 pt-6">
          {renderView()}
        </main>

        {/* Daily Detail Modal/Panel */}
        {selectedDate && selectedZmanim && (
          <>
            <div 
              onClick={() => setSelectedDate(null)}
              className="fixed inset-0 bg-chabad-blue/40 backdrop-blur-sm z-40"
            />
            <div 
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-hidden"
            >
              <DailyDetail 
                date={selectedDate}
                events={allEvents}
                tasks={allTasks}
                chassidicEvents={[]}
                zmanim={selectedZmanim}
                onClose={() => setSelectedDate(null)}
                onAddTask={(d) => {
                  setSelectedDate(d);
                  setIsAddTaskOpen(true);
                }}
              />
            </div>
          </>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
          <button 
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-chabad-gold text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
          <button 
            onClick={handleGoToToday}
            className="bg-chabad-blue text-white px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border-2 border-chabad-gold/30"
          >
            <Crown size={18} className="text-chabad-gold fill-chabad-gold" />
            היום
          </button>
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button 
            onClick={() => setActiveView('calendar')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'calendar' ? 'text-chabad-blue scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <CalendarIcon size={24} strokeWidth={activeView === 'calendar' ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">לוח</span>
          </button>
          <button 
            onClick={() => setActiveView('times')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'times' ? 'text-chabad-blue scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <Clock size={24} strokeWidth={activeView === 'times' ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">זמנים</span>
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`flex flex-col items-center gap-1 transition-all ${activeView === 'settings' ? 'text-chabad-blue scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          >
            <Settings size={24} strokeWidth={activeView === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">הגדרות</span>
          </button>
        </nav>

        <AddTaskModal 
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSave={handleSaveTask}
        initialDate={selectedDate || new Date()}
      />
    </div>
  );
}
