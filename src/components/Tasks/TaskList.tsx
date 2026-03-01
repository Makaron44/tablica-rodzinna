import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Heart, ThumbsUp, Trash2, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabase';

interface Reaction {
    emoji: string;
    user_name: string;
}

interface Task {
    id: string;
    title: string;
    assigned_to: string;
    is_completed: boolean;
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    reactions?: Reaction[];
}

export const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        setLoading(true);
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*, reactions(*)')
            .order('created_at', { ascending: false });

        if (!tasksError && tasksData) {
            setTasks(tasksData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();

        const channel = supabase
            .channel('tasks-all-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => fetchTasks()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reactions' },
                () => fetchTasks()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleTask = async (id: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;

        if (nextStatus) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#8b5cf6']
            });
        }

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: nextStatus })
            .eq('id', id);

        if (error) alert('Błąd: ' + error.message);
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) alert('Błąd usuwania: ' + error.message);
    };

    const addReaction = async (taskId: string, emoji: string) => {
        const { error } = await supabase
            .from('reactions')
            .insert([{ task_id: taskId, emoji, user_name: 'Rodzinka' }]);

        if (error) alert('Błąd reakcji: ' + error.message);
    };

    const getPersonStyles = (name: string) => {
        switch (name) {
            case 'Agusia': return { emoji: '👱‍♀️', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
            case 'Maciej': return { emoji: '👨', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
            case 'Patusia': return { emoji: '👩', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
            default: return { emoji: '👤', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
        }
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="italic text-sm">Synchronizacja z bazą...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-xl font-semibold">Lista zadań</h2>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                    {tasks.filter(t => !t.is_completed).length} do zrobienia
                </span>
            </div>

            <AnimatePresence initial={false}>
                {tasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass p-12 text-center text-slate-500 italic"
                    >
                        Brak zadań. Dodaj coś za pomocą przycisku "+" na górze!
                    </motion.div>
                ) : (
                    tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`glass p-4 transition-all duration-300 ${task.is_completed ? 'opacity-60 bg-white/5' : ''}`}
                        >
                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleTask(task.id, task.is_completed)}
                                    className={`mt-1 flex-shrink-0 transition-colors ${task.is_completed ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'}`}
                                >
                                    {task.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </button>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-medium ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                                task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                                                    'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {task.priority === 'high' ? 'Pilne' : task.priority === 'medium' ? 'Średnie' : 'Niskie'}
                                            </div>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-1 hover:bg-rose-500/20 rounded-lg text-slate-600 hover:text-rose-400 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-3">
                                        <div className="flex items-center">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-bold ${getPersonStyles(task.assigned_to).color}`}>
                                                <span>{getPersonStyles(task.assigned_to).emoji}</span>
                                                <span>{task.assigned_to}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex -space-x-1.5">
                                                {['👍', '❤️', '👏', '💪'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => addReaction(task.id, emoji)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full glass hover:bg-white/20 transition-all text-sm border border-white/10 active:scale-95 shadow-lg"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>

                                            {task.reactions && task.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Array.from(new Set(task.reactions.map(r => r.emoji))).map(emoji => (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            key={emoji}
                                                            className="text-[10px] bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1.5 shadow-sm"
                                                        >
                                                            <span className="filter drop-shadow-sm">{emoji}</span>
                                                            <span className="text-indigo-300 font-bold">{task.reactions?.filter(r => r.emoji === emoji).length}</span>
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    );
};
