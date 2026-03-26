import React from 'react';
import { MapPin, Globe, Bell, Shield, Info, LogOut } from 'lucide-react';

interface SettingsViewProps {
  onUpdateLocation: () => void;
  onLogout: () => void;
  isAuth: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onUpdateLocation, 
  onLogout,
  isAuth 
}) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="px-1">
        <h2 className="text-3xl font-black text-chabad-blue tracking-tight">הגדרות</h2>
        <p className="text-gray-400 font-bold text-sm">נהל את העדפות האפליקציה שלך</p>
      </div>

      {/* Location Section */}
      <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chabad-blue/10 rounded-xl text-chabad-blue">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-800">מיקום וזמנים</h3>
              <p className="text-xs text-gray-400">עדכן את המיקום שלך לחישוב מדויק</p>
            </div>
          </div>
          
          <button 
            onClick={onUpdateLocation}
            className="w-full bg-chabad-blue text-white py-4 rounded-2xl font-black hover:bg-chabad-blue/90 transition-all flex items-center justify-center gap-2"
          >
            <MapPin size={18} />
            עדכן מיקום (GPS)
          </button>
        </div>
      </section>

      {/* Customs Section */}
      <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chabad-gold/10 rounded-xl text-chabad-gold">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-800">מנהגים ונוסח</h3>
              <p className="text-xs text-gray-400">בחר את נוסח התפילה והזמנים</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {['חב"ד (אדמו"ר הזקן)', 'אשכנז', 'עדות המזרח'].map((custom, i) => (
              <button 
                key={custom}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  i === 0 ? 'border-chabad-blue bg-chabad-blue/5' : 'border-gray-50 hover:border-gray-200'
                }`}
              >
                <span className={`font-bold ${i === 0 ? 'text-chabad-blue' : 'text-gray-600'}`}>{custom}</span>
                {i === 0 && <div className="w-2 h-2 bg-chabad-blue rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* App Info */}
      <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm divide-y divide-gray-50">
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-gray-400" />
            <span className="font-bold text-gray-700">התראות</span>
          </div>
          <div className="w-10 h-6 bg-gray-200 rounded-full relative">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-gray-400" />
            <span className="font-bold text-gray-700">פרטיות ואבטחה</span>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-gray-400" />
            <span className="font-bold text-gray-700">אודות ChabadSync</span>
          </div>
          <span className="text-xs text-gray-300 font-bold">v1.0.0</span>
        </div>
      </section>

      {isAuth && (
        <button 
          onClick={onLogout}
          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          התנתק מהחשבון
        </button>
      )}
    </div>
  );
};
