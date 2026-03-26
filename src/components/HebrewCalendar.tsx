import React, { useMemo } from 'react';
import { 
  format, 
  isSameDay, 
  addDays, 
  subDays,
  isSameMonth
} from 'date-fns';
import { JewishCalendar, HebrewDateFormatter } from 'kosher-zmanim';
import { HDate } from '@hebcal/core';
import { ChevronRight, ChevronLeft, Star, Crown } from 'lucide-react';
import { getChassidicEvent } from '../lib/chabadEvents';
import { safeFormatHebrewNumber } from '../lib/zmanim';

interface HebrewCalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export const HebrewCalendarGrid: React.FC<HebrewCalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange
}) => {
  const { days, monthStartHDate } = useMemo(() => {
    const hDate = new HDate(currentDate);
    const firstOfHMonth = new HDate(1, hDate.getMonth(), hDate.getFullYear());
    const gregFirst = firstOfHMonth.greg();
    
    // To show a full grid, we start from the Sunday before the 1st of the Hebrew month
    const startOfGrid = subDays(gregFirst, gregFirst.getDay());
    
    // We want to show at least 35 or 42 days (5 or 6 weeks)
    const gridDays: Date[] = [];
    for (let i = 0; i < 42; i++) {
      gridDays.push(addDays(startOfGrid, i));
    }
    
    return { days: gridDays, monthStartHDate: firstOfHMonth };
  }, [currentDate]);

  const formatter = useMemo(() => {
    const f = new HebrewDateFormatter();
    f.setHebrewFormat(true);
    return f;
  }, []);

  const getJewishDayInfo = (date: Date) => {
    if (isNaN(date.getTime())) {
      return { hebrewDay: "?", event: undefined, specialType: 'none', specialLabel: "", parsha: "" };
    }
    const jc = new JewishCalendar();
    jc.setGregorianDate(date.getFullYear(), date.getMonth(), date.getDate());
    
    const jYear = jc.getJewishYear();
    const jMonth = jc.getJewishMonth();
    const jDay = jc.getJewishDayOfMonth();

    if (!Number.isFinite(jYear) || !Number.isFinite(jMonth) || !Number.isFinite(jDay)) {
      jc.setJewishDate(5784, 1, 1);
    } else {
      jc.setJewishDate(Math.round(jYear), Math.round(jMonth), Math.round(jDay));
    }

    let hebrewDay = "";
    let event: any = undefined;
    let specialType: 'holiday' | 'fast' | 'rosh-chodesh' | 'none' = 'none';
    let specialLabel = "";
    let parsha = "";

    try {
      const day = Math.round(jc.getJewishDayOfMonth());
      const month = Math.round(jc.getJewishMonth());
      
      if (!Number.isInteger(day) || !Number.isInteger(month)) {
        throw new Error("Jewish date components are not integers or are NaN/Infinite");
      }
      
      event = getChassidicEvent(day, month);
      hebrewDay = safeFormatHebrewNumber(formatter, day);
      
      try {
        if (jc.isYomTov() || jc.isCholHamoed()) {
          specialType = 'holiday';
          specialLabel = formatter.formatYomTov(jc);
        } else if (jc.isTaanis()) {
          specialType = 'fast';
          specialLabel = "צום";
        } else if (jc.isRoshChodesh()) {
          specialType = 'rosh-chodesh';
          specialLabel = "ר\"ח";
        }
      } catch (e) {
        console.error("Yom Tov/Special day formatting failed", e);
      }

      if (jc.getDayOfWeek() === 7) {
        try {
          const p = jc.getParsha();
          if (typeof p === 'number' && Number.isInteger(p) && p >= 0) {
            parsha = formatter.formatParsha(p);
          }
        } catch (e) {
          console.error("Parsha formatting failed", e);
        }
      }
    } catch (e) {
      console.error("Jewish day info formatting failed", e);
      hebrewDay = "?";
    }

    return { hebrewDay, event, specialType, specialLabel, parsha };
  };

  const currentJewishMonth = useMemo(() => {
    const jc = new JewishCalendar();
    const gregFirst = monthStartHDate.greg();
    jc.setGregorianDate(gregFirst.getFullYear(), gregFirst.getMonth(), gregFirst.getDate());
    
    try {
      const year = Math.round(jc.getJewishYear());
      let monthStr = "";
      try {
        monthStr = formatter.formatMonth(jc);
      } catch (e) {
        monthStr = String(Math.round(jc.getJewishMonth()));
      }
      return `${monthStr} ${safeFormatHebrewNumber(formatter, year)}`;
    } catch (e) {
      return "שגיאה בלוח";
    }
  }, [monthStartHDate, formatter]);

  const handlePrevMonth = () => {
    const prevMonthHDate = monthStartHDate.prev();
    onMonthChange(prevMonthHDate.greg());
  };

  const handleNextMonth = () => {
    const nextMonthHDate = monthStartHDate.next();
    onMonthChange(nextMonthHDate.greg());
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden" dir="rtl">
      {/* Calendar Header */}
      <div className="bg-chabad-blue p-6 text-white flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full">
          <ChevronRight size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight">{currentJewishMonth}</h2>
          <p className="text-chabad-gold font-bold text-sm opacity-80">{format(currentDate, 'MMMM yyyy')}</p>
        </div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const { hebrewDay, event, specialType, specialLabel, parsha } = getJewishDayInfo(day);
          const isCurrentMonth = new HDate(day).getMonth() === monthStartHDate.getMonth();
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={i}
              onClick={() => {
                const cleanDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                onDateSelect(cleanDate);
              }}
              className={`
                relative h-24 border-r border-b border-gray-50 flex flex-col items-center justify-center transition-all
                ${new HDate(day).getMonth() !== monthStartHDate.getMonth() ? 'bg-gray-50/50' : 
                  specialType === 'holiday' ? 'bg-chabad-gold/20' : 
                  specialType === 'fast' ? 'bg-red-50' :
                  event?.isGeulah ? 'bg-chabad-gold/10' : 'bg-white'}
                ${isSelected ? 'ring-2 ring-inset ring-chabad-gold z-10' : ''}
                ${isToday && specialType === 'none' && !event?.isGeulah ? 'bg-chabad-gold/5' : ''}
              `}
            >
              <span className={`
                text-xl font-black leading-none mb-1
                ${!isCurrentMonth ? 'text-gray-300' : isSelected ? 'text-chabad-blue' : 'text-gray-800'}
                ${specialType === 'rosh-chodesh' ? 'text-chabad-gold underline decoration-2 underline-offset-4' : ''}
                ${specialType === 'holiday' ? 'text-chabad-blue' : ''}
                ${specialType === 'fast' ? 'text-red-600' : ''}
              `}>
                {hebrewDay}
              </span>
              <span className={`text-[10px] font-bold ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </span>

              {parsha && isCurrentMonth && (
                <span className="text-[9px] font-black text-chabad-blue/40 mt-1">
                  {parsha}
                </span>
              )}

              {specialLabel && isCurrentMonth && (
                <span className={`absolute bottom-1 text-[8px] font-black px-1 rounded ${
                  specialType === 'holiday' ? 'bg-chabad-blue text-white' : 
                  specialType === 'fast' ? 'bg-red-600 text-white' : 'text-chabad-gold'
                }`}>
                  {specialLabel}
                </span>
              )}
              
              {event && (
                <div className="absolute top-1 left-1">
                  <Crown size={12} className="text-chabad-gold fill-chabad-gold" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
