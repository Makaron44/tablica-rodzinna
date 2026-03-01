import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { notifyFamily } from '../components/Notifications/NotificationCenter';

export const useFamilySync = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Check connection
        const checkConn = async () => {
            const { data, error } = await supabase.from('tasks').select('id').limit(1);
            if (!error) setIsConnected(true);
        };
        checkConn();

        // Set up Realtime listener (if Supabase is configured)
        const channel = supabase
            .channel('family-room')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                (payload) => {
                    console.log('Task change received!', payload);
                    if (payload.eventType === 'INSERT') {
                        notifyFamily({
                            type: 'info',
                            title: 'Nowe zadanie!',
                            message: `Dodano zadanie: ${payload.new.title}`
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'events' },
                (payload) => {
                    notifyFamily({
                        type: 'info',
                        title: 'Wydarzenie!',
                        message: `Nowe wydarzenie w kalendarzu: ${payload.new.title}`
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'alerts' },
                (payload) => {
                    notifyFamily({
                        type: payload.new.type,
                        title: payload.new.title,
                        message: payload.new.message
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { isConnected };
};
