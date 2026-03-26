import React, { useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, Calendar as CalendarIcon, Crown, Clock, X, Plus } from 'lucide-react';
import { GoogleEvent, GoogleTask } from '../lib/db';
import { ZmanimData } from '../lib/zmanim';
import { ChassidicEvent } from '../lib/chabadEvents';

interface DailyDetailProps {
  date: Date;
  events: GoogleEvent[];
  tasks: GoogleTask[];
  chassidicEvents: ChassidicEvent[];
  zmanim: ZmanimData;
  onClose?: () => void;
  onAddTask?: (date: Date) => void;
}

export const DailyDetail: React.FC<DailyDetailProps> = ({ 
  date, 
  events, 
  tasks, 
  zmanim,
  onClose,
  onAddTask
}) => {
  const dayEvents = events.filter(e => {
    const start = e.start.dateTime || e.start.date;
    return start && isSameDay(parseISO(start), date);
  });

  const dayTasks = tasks.filter(t => {
    return t.due && isSameDay(parseISO(t.due), date);
  });

  return (
    <div className="bg-gray-50 h-[90vh] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
      {/* Drag Handle / Close */}
      <div className="flex justify-center pt-4 pb-2 flex-shrink-0">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>
      
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={20} />
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
        {/* Date Header */}
        <div className="text-center space-y-1 pt-4">
          <h2 className="text-3xl font-black text-chabad-blue tracking-tight">
            {format(date, 'EEEE, d MMMM')}
          </h2>
          <p className="text-chabad-gold font-black text-xl">
            {zmanim.hebrewDate}
          </p>
          {zmanim.parsha && (
            <p className="text-chabad-blue/50 font-bold text-sm">
              פרשת {zmanim.parsha}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => onAddTask?.(date)}
            className="flex-1 bg-chabad-blue text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-chabad-blue/20"
          >
            <Plus size={18} />
            הוסף משימה/אירוע
          </button>
        </div>

        {/* Special Day Info (Holiday/Fast/Shabbat) */}
        {(zmanim.specialDay || zmanim.candleLighting || zmanim.havdalah || zmanim.fastStart) && (
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
            {zmanim.specialDay && (
              <div className="text-center pb-2 border-b border-gray-50">
                <span className="bg-chabad-blue text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {zmanim.specialDay}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {zmanim.candleLighting && (
                <div className="text-center p-3 bg-chabad-gold/5 rounded-2xl border border-chabad-gold/10">
                  <p className="text-[10px] text-chabad-gold font-black uppercase mb-1">הדלקת נרות</p>
                  <p className="text-xl font-mono font-black text-chabad-blue">{format(zmanim.candleLighting, 'HH:mm')}</p>
                </div>
              )}
              {zmanim.havdalah && (
                <div className="text-center p-3 bg-chabad-blue/5 rounded-2xl border border-chabad-blue/10">
                  <p className="text-[10px] text-chabad-blue font-black uppercase mb-1">צאת השבת/חג</p>
                  <p className="text-xl font-mono font-black text-chabad-blue">{format(zmanim.havdalah, 'HH:mm')}</p>
                </div>
              )}
              {zmanim.fastStart && (
                <div className="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-black uppercase mb-1">תחילת הצום</p>
                  <p className="text-xl font-mono font-black text-red-600">{format(zmanim.fastStart, 'HH:mm')}</p>
                </div>
              )}
              {zmanim.fastEnd && (
                <div className="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-black uppercase mb-1">סיום הצום</p>
                  <p className="text-xl font-mono font-black text-red-600">{format(zmanim.fastEnd, 'HH:mm')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. Chassidic Event (If exists) */}
        {zmanim.chassidicEvent && (
          <div className={`rounded-3xl p-6 flex items-start gap-4 border-2 ${zmanim.chassidicEvent.isGeulah ? 'bg-chabad-gold/20 border-chabad-gold' : 'bg-chabad-gold/10 border-chabad-gold/20'}`}>
            <div className="bg-chabad-gold p-3 rounded-2xl text-white shadow-lg">
              <Crown size={24} fill="white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-chabad-blue text-lg leading-tight">{zmanim.chassidicEvent.title}</h4>
                {zmanim.chassidicEvent.isGeulah && (
                  <span className="bg-chabad-gold text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">גאולה</span>
                )}
              </div>
              <p className="text-chabad-blue/70 text-sm font-bold leading-relaxed">
                {zmanim.chassidicEvent.description}
              </p>
            </div>
          </div>
        )}

        {/* 2. Tasks & Personal Events */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CalendarIcon size={18} className="text-chabad-blue opacity-50" />
            <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">משימות ואירועים</h3>
          </div>
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            {dayTasks.length === 0 && dayEvents.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-gray-300 font-black text-sm">אין אירועים אישיים להיום</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {dayTasks.map(task => (
                  <div key={task.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <CheckCircle2 size={22} className={task.status === 'completed' ? 'text-green-500' : 'text-gray-200'} />
                    <div className="flex-1">
                      <p className={`font-bold text-base ${task.status === 'completed' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      {task.notes && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{task.notes}</p>}
                    </div>
                  </div>
                ))}
                {dayEvents.map(event => (
                  <div key={event.id} className="p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <div className="w-1.5 h-12 bg-chabad-blue rounded-full mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-base text-gray-800">{event.summary}</p>
                      <p className="text-xs text-chabad-gold font-black mt-1 uppercase tracking-wider">
                        {event.start.dateTime ? format(parseISO(event.start.dateTime), 'HH:mm') : 'כל היום'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Zmanim */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Clock size={18} className="text-chabad-blue opacity-50" />
            <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-[0.2em]">זמני היום</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {zmanim.zmanim.map((zman, i) => (
              <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">{zman.name}</p>
                <p className="text-2xl font-mono font-black text-chabad-blue">
                  {zman.time ? format(zman.time, 'HH:mm') : '--:--'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
