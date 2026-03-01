import React, { useState, useEffect } from 'react';
import { Calendar, ListTodo, MessageSquare, Bell, User, Plus, Heart, ThumbsUp, MessageCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskList } from './components/Tasks/TaskList';
import { FamilyCalendar } from './components/Calendar/FamilyCalendar';
import { NotificationCenter, notifyFamily } from './components/Notifications/NotificationCenter';
import { useFamilySync } from './hooks/useFamilySync';
import { AddTaskModal } from './components/Tasks/AddTaskModal';
import { supabase } from './lib/supabase';

interface ActivityItem {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
    icon: any;
    color: string;
}

function App() {
    const [activeTab, setActiveTab] = useState('calendar');
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [lastClearedAt, setLastClearedAt] = useState<string | null>(localStorage.getItem('activityLastClearedAt'));
    const { isConnected } = useFamilySync();

    // Fetch recent activity from tasks and events
    const fetchActivity = async () => {
        const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(10);
        const { data: events } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(10);

        let newActivities: ActivityItem[] = [];

        if (tasks) {
            tasks.forEach(t => {
                // Only add if created after last clear
                if (!lastClearedAt || new Date(t.created_at) > new Date(lastClearedAt)) {
                    newActivities.push({
                        id: `task-${t.id}`,
                        user: t.assigned_to,
                        action: t.is_completed ? 'ukończył(a) zadanie' : 'ma nowe zadanie:',
                        target: t.title,
                        time: new Date(t.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                        icon: t.is_completed ? Heart : ListTodo,
                        color: t.is_completed ? 'text-pink-400' : 'text-indigo-400'
                    });
                }
            });
        }

        if (events) {
            events.forEach(e => {
                if (!lastClearedAt || new Date(e.created_at) > new Date(lastClearedAt)) {
                    newActivities.push({
                        id: `event-${e.id}`,
                        user: 'Rodzinka',
                        action: 'dodała wydarzenie:',
                        target: e.title,
                        time: new Date(e.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                        icon: Calendar,
                        color: 'text-emerald-400'
                    });
                }
            });
        }

        setActivities(newActivities.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8));
    };

    const clearActivity = () => {
        const now = new Date().toISOString();
        setLastClearedAt(now);
        localStorage.setItem('activityLastClearedAt', now);
        setActivities([]);
    };

    useEffect(() => {
        fetchActivity();

        // Subscribe to all changes for activity feed
        const channel = supabase.channel('global-activity')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchActivity())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [lastClearedAt]);

    const tabs = [
        { id: 'calendar', icon: Calendar, label: 'Kalendarz' },
        { id: 'tasks', icon: ListTodo, label: 'Zadania' },
        { id: 'activity', icon: MessageSquare, label: 'Aktywność' },
        { id: 'alerts', icon: Bell, label: 'Alerty' },
    ];

    return (
        <div className="flex flex-col min-h-screen text-white bg-slate-900 overflow-hidden font-sans">
            <NotificationCenter />

            {/* Header */}
            <header className="px-6 pt-8 pb-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900 to-transparent">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                        Rodzinna Tablica
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-400">Dzień dobry, Rodzino!</p>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} title={isConnected ? 'Połączono z Supabase' : 'Brak połączenia'} />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddTaskOpen(true)}
                        className="p-2 glass rounded-full hover:bg-white/10 transition-colors shadow-lg shadow-indigo-500/10"
                    >
                        <Plus className="w-6 h-6 text-indigo-300" />
                    </button>
                    <div className="w-10 h-10 rounded-full glass flex items-center justify-center border-2 border-indigo-500/30 overflow-hidden">
                        <User className="w-5 h-5 text-indigo-300" />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative px-4 overflow-y-auto pb-32">
                <AnimatePresence mode="wait">
                    {activeTab === 'calendar' && (
                        <motion.section
                            key="calendar"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4"
                        >
                            <FamilyCalendar />
                        </motion.section>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.section
                            key="tasks"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4"
                        >
                            <TaskList />
                        </motion.section>
                    )}

                    {activeTab === 'activity' && (
                        <motion.section
                            key="activity"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4 space-y-4 px-2"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Ostatnia Aktywność</h2>
                                {activities.length > 0 && (
                                    <button
                                        onClick={clearActivity}
                                        className="text-[10px] font-bold text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-colors flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg border border-white/5"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Wyczyść
                                    </button>
                                )}
                            </div>
                            {activities.length === 0 ? (
                                <div className="glass p-12 text-center text-slate-500 italic">
                                    Brak nowej aktywności.<br />
                                    <span className="text-[10px] uppercase tracking-widest mt-2 block opacity-50">Wszystko jest na bieżąco!</span>
                                </div>
                            ) : (
                                activities.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass p-4 flex gap-4 items-center border-l-2 border-transparent hover:border-indigo-500/50 transition-all"
                                    >
                                        <div className={`p-2 rounded-xl bg-white/5 ${item.color}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">
                                                <span className="font-bold text-slate-200">{item.user}</span>{' '}
                                                <span className="text-slate-400">{item.action}</span>{' '}
                                                <span className="font-medium text-indigo-300">{item.target}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{item.time}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.section>
                    )}

                    {activeTab === 'alerts' && (
                        <motion.section
                            key="alerts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mt-4 glass p-8 text-center"
                        >
                            <Bell className="w-12 h-12 mx-auto text-indigo-500/20 mb-4" />
                            <h3 className="text-xl font-bold mb-2">System Alertów</h3>
                            <p className="text-slate-400 max-w-[200px] mx-auto text-sm mb-6">
                                Wyślij pilne powiadomienie do wszystkich domowników.
                            </p>
                            <button
                                onClick={() => notifyFamily({ type: 'alert', title: 'Ręczny Alert', message: 'Ktoś potrzebuje Twojej uwagi!' })}
                                className="w-full py-3 glass bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl text-xs font-bold uppercase tracking-widest text-rose-300 border border-rose-500/30 transition-all"
                            >
                                Wyślij Pilny Alert 🚨
                            </button>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* Navigation Bar */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass p-2 flex justify-around items-center z-50 shadow-2xl backdrop-blur-xl border border-white/10">
                {tabs.map(({ id, icon: Icon, label }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${isActive
                                ? 'text-indigo-300'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-indigo-500/10 rounded-2xl -z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Modals */}
            <AddTaskModal
                isOpen={isAddTaskOpen}
                onClose={() => setIsAddTaskOpen(false)}
                onSuccess={() => {
                    fetchActivity();
                    notifyFamily({ type: 'info', title: 'Zadanie dodane!', message: 'Sukces! Nowe zadanie pojawiło się na liście.' });
                }}
            />

            {/* Ambient backgrounds */}
            <div className="fixed top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[120px] pointer-events-none rounded-full" />
        </div>
    );
}

export default App;
