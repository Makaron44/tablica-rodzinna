import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { AddEventModal } from './AddEventModal';

interface Event {
    id: string;
    start_time: string;
    title: string;
    category: 'work' | 'family' | 'health' | 'other';
}

export const FamilyCalendar: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*');

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();

        const channel = supabase
            .channel('events-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'events' },
                () => {
                    fetchEvents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const deleteEvent = async (id: string) => {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) alert('Błąd: ' + error.message);
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const categoryColors = {
        family: 'bg-emerald-500',
        work: 'bg-indigo-500',
        health: 'bg-rose-500',
        other: 'bg-slate-500',
    };

    return (
        <div className="glass p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {format(currentMonth, 'MMMM yyyy', { locale: pl })}
                    </h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Podgląd wydarzeń</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 glass rounded-xl hover:bg-white/10">
                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <button onClick={nextMonth} className="p-2 glass rounded-xl hover:bg-white/10">
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isSelected = isSameDay(day, selectedDate);
                    const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day));

                    return (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedDate(day)}
                            className={`relative h-16 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 ${!isCurrentMonth ? 'opacity-20 pointer-events-none' :
                                isSelected ? 'bg-indigo-600/40 border border-indigo-400/50 shadow-lg shadow-indigo-500/20' :
                                    'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {format(day, 'd')}
                            </span>

                            <div className="flex gap-0.5">
                                {dayEvents.slice(0, 3).map((event, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${categoryColors[event.category]}`}
                                    />
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDate.toString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-6 border-t border-white/10"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-200">
                            {format(selectedDate, 'd MMMM', { locale: pl })}
                        </h3>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20"
                        >
                            <PlusCircle className="w-3 h-3" />
                            DODAJ
                        </button>
                    </div>

                    <div className="space-y-3">
                        {events.filter(e => isSameDay(parseISO(e.start_time), selectedDate)).length === 0 ? (
                            <p className="text-sm text-slate-500 italic py-4 text-center">Brak zaplanowanych wydarzeń.</p>
                        ) : (
                            events.filter(e => isSameDay(parseISO(e.start_time), selectedDate)).map((event) => (
                                <div key={event.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-6 rounded-full ${categoryColors[event.category]}`} />
                                        <span className="text-sm font-medium text-slate-200">{event.title}</span>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <AddEventModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchEvents}
                selectedDate={selectedDate}
            />
        </div>
    );
};
