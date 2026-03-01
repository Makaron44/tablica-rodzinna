import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Plus, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: Date;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSuccess, selectedDate }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'family' | 'work' | 'health' | 'other'>('family');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);

        // Create UTC date time
        const eventDate = new Date(selectedDate);
        eventDate.setHours(12, 0, 0, 0);

        const { error } = await supabase.from('events').insert([
            {
                title,
                category,
                start_time: eventDate.toISOString(),
                created_by: 'Rodzinka'
            }
        ]);

        setIsSubmitting(false);
        if (!error) {
            setTitle('');
            onSuccess();
            onClose();
        } else {
            alert('Błąd podczas dodawania wydarzenia: ' + error.message);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="glass w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold">Nowe Wydarzenie</h3>
                                <p className="text-xs text-indigo-300 mt-1 uppercase tracking-widest font-bold">
                                    {format(selectedDate, 'd MMMM yyyy')}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Nazwa wydarzenia</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Np. Kino, Urodziny..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kategoria</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'family', label: 'Rodzina', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                                        { id: 'work', label: 'Praca', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                                        { id: 'health', label: 'Zdrowie', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                                        { id: 'other', label: 'Inne', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id as any)}
                                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${category === cat.id ? cat.color + ' ring-2 ring-white/10' : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={isSubmitting || !title.trim()}
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all mt-4"
                            >
                                {isSubmitting ? 'Dodawanie...' : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Zapisz w kalendarzu
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
