import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Note {
    id: string;
    content: string;
    color: string;
    user_name: string;
    created_at: string;
}

const COLORS = [
    { name: 'yellow', class: 'bg-yellow-200 text-yellow-900 border-yellow-300' },
    { name: 'pink', class: 'bg-pink-200 text-pink-900 border-pink-300' },
    { name: 'blue', class: 'bg-blue-200 text-blue-900 border-blue-300' },
    { name: 'green', class: 'bg-emerald-200 text-emerald-900 border-emerald-300' },
    { name: 'purple', class: 'bg-purple-200 text-purple-900 border-purple-300' },
];

export const StickyNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].class);
    const [author, setAuthor] = useState('Anonim');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('sticky_notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setNotes(data);
    };

    useEffect(() => {
        fetchNotes();
        const channel = supabase
            .channel('sticky-notes-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sticky_notes' }, () => fetchNotes())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const addNote = async () => {
        if (!newContent.trim()) return;

        const { error } = await supabase.from('sticky_notes').insert([
            { content: newContent, color: selectedColor, user_name: author }
        ]);

        if (error) {
            alert('Błąd: ' + error.message);
        } else {
            setNewContent('');
            setIsAdding(false);
        }
    };

    const deleteNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase.from('sticky_notes').delete().eq('id', id);
        if (error) alert('Błąd usuwania: ' + error.message);
        if (selectedNote?.id === id) setSelectedNote(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-xl font-bold">Rodzinne Karteczki</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Zostaw wiadomość dla bliskich</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all border border-indigo-400/30"
                >
                    <Plus className="w-6 h-6 text-white" />
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`glass p-6 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Napisz coś miłego..."
                                className="w-full bg-transparent border-none focus:ring-0 text-[var(--text)] placeholder:text-slate-600 sticky-font text-2xl min-h-[120px] resize-none"
                                autoFocus
                            />

                            <div className="flex flex-wrap gap-3 items-center justify-between border-t border-white/5 pt-4">
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedColor(c.class)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${c.class.split(' ')[0]} ${selectedColor === c.class ? 'border-indigo-500 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                                        />
                                    ))}
                                </div>

                                <select
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-bold focus:ring-0 outline-none"
                                >
                                    <option value="Agusia" className="bg-slate-900">Agusia</option>
                                    <option value="Maciej" className="bg-slate-900">Maciej</option>
                                    <option value="Patusia" className="bg-slate-900">Patusia</option>
                                    <option value="Rodzinka" className="bg-slate-900">Rodzinka</option>
                                </select>
                            </div>

                            <button
                                onClick={addNote}
                                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Przyklej Karteczkę ✨
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {notes.map((note, idx) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, scale: 0.8, rotate: idx % 2 === 0 ? -5 : 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: idx % 2 === 0 ? -2 : 2 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 0 }}
                            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                            onClick={() => setSelectedNote(note)}
                            className={`${note.color} p-4 pb-2 rounded-sm shadow-xl flex flex-col justify-between min-h-[160px] border relative group cursor-pointer`}
                        >
                            <button
                                onClick={(e) => deleteNote(note.id, e)}
                                className="absolute top-2 right-2 p-1.5 bg-black/5 rounded-lg opacity-group-hover:opacity-100 transition-opacity hover:bg-black/10"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-black/40" />
                            </button>

                            <p className="sticky-font text-xl leading-tight whitespace-pre-wrap flex-1 mt-2">
                                {note.content}
                            </p>

                            <div className="mt-4 pt-2 border-t border-black/5 flex justify-between items-center opacity-70">
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{note.user_name}</span>
                                </div>
                                <span className="text-[8px] font-bold">{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Note Detail Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNote(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`${selectedNote.color} w-full max-w-sm p-8 rounded-sm shadow-2xl relative border z-10 flex flex-col min-h-[300px]`}
                        >
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white flex items-center gap-2"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">Zamknij</span>
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>

                            <p className="sticky-font text-3xl leading-relaxed whitespace-pre-wrap flex-1">
                                {selectedNote.content}
                            </p>

                            <div className="mt-8 pt-4 border-t border-black/10 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-black/5 rounded-full">
                                        <User className="w-5 h-5 text-black/60" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-black opacity-40 leading-none">Autor</p>
                                        <p className="text-sm font-bold uppercase tracking-wider">{selectedNote.user_name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest font-black opacity-40 leading-none">Data</p>
                                    <p className="text-[10px] font-bold">{new Date(selectedNote.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {notes.length === 0 && !isAdding && (
                <div className="glass p-12 text-center text-slate-500 italic">
                    Tablica jest pusta.<br />
                    <span className="text-[10px] uppercase tracking-widest mt-2 block opacity-50">Zostaw pierwszą wiadomość!</span>
                </div>
            )}
        </div>
    );
};
