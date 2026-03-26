import React from 'react';
import { format } from 'date-fns';
import { Clock, Info } from 'lucide-react';
import { ZmanimData } from '../lib/zmanim';

interface ZmanimListProps {
  data: ZmanimData;
}

export const ZmanimList: React.FC<ZmanimListProps> = ({ data }) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4">
      <div className="bg-chabad-blue text-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="text-2xl font-bold mb-1">זמני היום</h2>
        <p className="text-chabad-gold font-medium">
          {data.isNextDay ? "ליל יום המחרת" : "יום הנוכחי"}
        </p>
      </div>

      <div className="grid gap-3">
        {data.zmanim.map((zman, index) => (
          <div 
            key={index}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-chabad-gold transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-bold text-gray-800">{zman.name}</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Info size={12} />
                {zman.description}
              </span>
            </div>
            <div className="flex items-center gap-2 text-chabad-blue font-mono font-bold text-lg">
              <Clock size={18} className="text-chabad-gold" />
              {zman.time ? format(zman.time, 'HH:mm') : '--:--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
