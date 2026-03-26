import React from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Zman } from '../lib/zmanim';

interface TimesViewProps {
  zmanim: Zman[];
  date: Date;
}

export const TimesView: React.FC<TimesViewProps> = ({ zmanim, date }) => {
  const getIcon = (name: string) => {
    if (name.includes('הנץ') || name.includes('עלות')) return <Sunrise size={20} className="text-chabad-gold" />;
    if (name.includes('שקיעה') || name.includes('פלג')) return <Sunset size={20} className="text-orange-500" />;
    if (name.includes('צאת') || name.includes('לילה')) return <Moon size={20} className="text-chabad-blue" />;
    if (name.includes('שמע') || name.includes('תפילה')) return <Clock size={20} className="text-blue-400" />;
    return <Sun size={20} className="text-yellow-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="px-1 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-chabad-blue tracking-tight">זמני היום</h2>
          <p className="text-gray-400 font-bold text-sm">{format(date, 'dd/MM/yyyy')}</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CalendarIcon size={24} className="text-chabad-blue" />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {zmanim.map((zman, i) => (
          <div 
            key={zman.name}
            className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors ${
              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                {getIcon(zman.name)}
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">{zman.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold">{zman.description}</p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-lg font-black text-chabad-blue tabular-nums">
                {zman.time ? format(zman.time, 'HH:mm') : '--:--'}
              </span>
              {zman.time && (
                <p className="text-[10px] text-gray-300 font-bold text-left">
                  {format(zman.time, 'ss')} ש'
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-chabad-blue/5 rounded-[32px] border border-chabad-blue/10">
        <h4 className="font-black text-chabad-blue text-sm mb-2 flex items-center gap-2">
          <InfoIcon size={16} />
          הערה חשובה
        </h4>
        <p className="text-xs text-gray-500 font-bold leading-relaxed">
          הזמנים מחושבים לפי שיטת אדמו"ר הזקן (בעל התניא) כפי שמופיעים בלוח "כולל חב"ד". 
          יש להחמיר בסוף זמן קריאת שמע ותפילה כפי המופיע בלוח.
        </p>
      </div>
    </div>
  );
};

const InfoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
