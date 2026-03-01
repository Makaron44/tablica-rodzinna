import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertCircle, Info } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'info' | 'alert';
    title: string;
    message: string;
}

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Function to add a notification (can be exported or used via custom event)
    useEffect(() => {
        const handleNotify = (e: any) => {
            const newNotify: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                ...e.detail
            };
            setNotifications(prev => [...prev, newNotify]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNotify.id));
            }, 5000);
        };

        window.addEventListener('family-notify', handleNotify);
        return () => window.removeEventListener('family-notify', handleNotify);
    }, []);

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        className="mb-3 pointer-events-auto"
                    >
                        <div className={`glass p-4 card-shadow flex gap-3 items-start border-l-4 ${n.type === 'alert' ? 'border-l-rose-500' : 'border-l-indigo-500'
                            }`}>
                            <div className={`p-2 rounded-lg ${n.type === 'alert' ? 'bg-rose-500/20 text-rose-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                {n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white">{n.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                                className="text-slate-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Helper function to trigger notification
export const notifyFamily = (notification: Omit<Notification, 'id'>) => {
    const event = new CustomEvent('family-notify', { detail: notification });
    window.dispatchEvent(event);
};
