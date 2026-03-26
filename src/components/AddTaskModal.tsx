import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, Save, Loader2, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths } from 'date-fns';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: { 
    title: string; 
    date: Date; 
    time: string; 
    type: 'task' | 'event';
    hebrewRecurrence?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      endDate: Date;
    }
  }) => Promise<void>;
  initialDate: Date;
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialDate 
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [type, setType] = useState<'task' | 'event'>('task');
  const [isHebrewRecurrence, setIsHebrewRecurrence] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [endDate, setEndDate] = useState(format(addMonths(initialDate, 12), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title,
        date: new Date(date),
        time,
        type,
        hebrewRecurrence: isHebrewRecurrence ? {
          frequency,
          endDate: new Date(endDate)
        } : undefined
      });
      onClose();
      setTitle('');
      setIsHebrewRecurrence(false);
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-chabad-blue tracking-tight">הוספת משימה</h2>
                <button 
                  onClick={onClose}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">מה המשימה?</label>
                  <input 
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="למשל: ללמוד חסידות..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-chabad-blue focus:bg-white p-5 rounded-3xl font-bold text-lg transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Calendar size={12} /> תאריך
                    </label>
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-chabad-blue focus:bg-white p-4 rounded-2xl font-bold transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Clock size={12} /> שעה
                    </label>
                    <input 
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-chabad-blue focus:bg-white p-4 rounded-2xl font-bold transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Tag size={12} /> סוג
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setType('task')}
                      className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                        type === 'task' ? 'bg-chabad-blue border-chabad-blue text-white' : 'bg-white border-gray-100 text-gray-500'
                      }`}
                    >
                      משימה
                    </button>
                    <button 
                      type="button"
                      onClick={() => setType('event')}
                      className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                        type === 'event' ? 'bg-chabad-gold border-chabad-gold text-white' : 'bg-white border-gray-100 text-gray-500'
                      }`}
                    >
                      אירוע
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chabad-blue/10 rounded-xl text-chabad-blue">
                        <Repeat size={18} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-chabad-blue">חזרתיות לפי תאריך עברי</p>
                        <p className="text-[10px] font-bold text-gray-400">צור סדרת אירועים לפי הלוח העברי</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHebrewRecurrence(!isHebrewRecurrence)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isHebrewRecurrence ? 'bg-chabad-blue' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHebrewRecurrence ? 'right-7' : 'right-1'}`} />
                    </button>
                  </div>

                  {isHebrewRecurrence && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 p-4 border-2 border-gray-50 rounded-3xl"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">תדירות</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setFrequency(f)}
                              className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all ${
                                frequency === f ? 'bg-chabad-blue border-chabad-blue text-white' : 'bg-white border-gray-50 text-gray-400'
                              }`}
                            >
                              {f === 'daily' ? 'כל יום' : f === 'weekly' ? 'כל שבוע' : f === 'monthly' ? 'כל חודש עברי' : 'כל שנה עברית'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">עד מתי?</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-chabad-blue focus:bg-white p-3 rounded-xl font-bold text-sm transition-all outline-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <button 
                  disabled={!title || isSaving}
                  className="w-full bg-chabad-blue text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-chabad-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  שמור משימה
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
