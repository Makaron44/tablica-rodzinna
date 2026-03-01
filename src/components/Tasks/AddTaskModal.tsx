import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('Agusia');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('tasks').insert([
            { title, assigned_to: assignee, priority, is_completed: false }
        ]);

        setIsSubmitting(false);
        if (!error) {
            setTitle('');
            onSuccess();
            onClose();
        } else {
            alert('Błąd podczas dodawania zadania: ' + error.message);
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
                            <h3 className="text-xl font-bold">Nowe Zadanie</h3>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Treść zadania</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Np. Podlać kwiatki..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Przypisz do</label>
                                    <div className="relative">
                                        <select
                                            value={assignee}
                                            onChange={(e) => setAssignee(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        >
                                            <option value="Agusia" className="bg-slate-800">Agusia 👱‍♀️</option>
                                            <option value="Maciej" className="bg-slate-800">Maciej 👨</option>
                                            <option value="Patusia" className="bg-slate-800">Patusia 👩</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priorytet</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    >
                                        <option value="low" className="bg-slate-800">Niski 🔵</option>
                                        <option value="medium" className="bg-slate-800">Średni 🟡</option>
                                        <option value="high" className="bg-slate-800">Pilny 🔴</option>
                                    </select>
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
                                        Dodaj zadanie
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
