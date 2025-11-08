import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SlotReservation {
  barber_id: string;
  date: string;
  time: string;
  client_phone: string;
  reserved_at: string;
  expires_at: string;
}

interface ReservedSlot {
  time: string;
  isReservedByMe: boolean;
  isReservedByOthers: boolean;
}

const RESERVATION_DURATION = 5 * 60 * 1000; // 5 minutos em ms

export const useSlotReservation = (barberId: string, date: string, clientPhone: string) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [reservedSlots, setReservedSlots] = useState<Map<string, SlotReservation>>(new Map());
  const [myReservation, setMyReservation] = useState<string | null>(null);

  const channelName = `slot-reservation:${barberId}:${date}`;

  useEffect(() => {
    // Criar canal de presença para reservas temporárias
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: clientPhone,
        },
      },
    });

    // Sincronizar estado de reservas
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<SlotReservation>();
        const newReservations = new Map<string, SlotReservation>();

        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            const now = new Date().getTime();
            const expiresAt = new Date(presence.expires_at).getTime();

            // Só adicionar se ainda não expirou
            if (expiresAt > now) {
              newReservations.set(presence.time, presence);
            }
          });
        });

        setReservedSlots(newReservations);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Nova reserva:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Reserva removida:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal de reservas conectado');
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [barberId, date, clientPhone, channelName]);

  /**
   * Reserva um slot temporariamente
   */
  const reserveSlot = useCallback(async (time: string): Promise<boolean> => {
    if (!channel) {
      console.error('Canal não inicializado');
      return false;
    }

    // Remover reserva anterior se existir
    if (myReservation) {
      await channel.track({});
    }

    const reservation: SlotReservation = {
      barber_id: barberId,
      date,
      time,
      client_phone: clientPhone,
      reserved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + RESERVATION_DURATION).toISOString(),
    };

    const status = await channel.track(reservation);
    
    if (status === 'ok') {
      setMyReservation(time);
      console.log('✅ Slot reservado:', time);
      
      // Auto-liberar após expiração
      setTimeout(() => {
        if (myReservation === time) {
          releaseSlot();
        }
      }, RESERVATION_DURATION);

      return true;
    }

    console.error('❌ Falha ao reservar slot');
    return false;
  }, [channel, barberId, date, clientPhone, myReservation]);

  /**
   * Libera a reserva atual
   */
  const releaseSlot = useCallback(async () => {
    if (!channel) return;

    await channel.track({});
    setMyReservation(null);
    console.log('🔓 Slot liberado');
  }, [channel]);

  /**
   * Verifica se um slot está reservado
   */
  const isSlotReserved = useCallback((time: string): ReservedSlot => {
    const reservation = reservedSlots.get(time);

    if (!reservation) {
      return {
        time,
        isReservedByMe: false,
        isReservedByOthers: false,
      };
    }

    const now = new Date().getTime();
    const expiresAt = new Date(reservation.expires_at).getTime();

    // Verificar se expirou
    if (expiresAt <= now) {
      return {
        time,
        isReservedByMe: false,
        isReservedByOthers: false,
      };
    }

    return {
      time,
      isReservedByMe: reservation.client_phone === clientPhone,
      isReservedByOthers: reservation.client_phone !== clientPhone,
    };
  }, [reservedSlots, clientPhone]);

  /**
   * Renova a reserva atual
   */
  const renewReservation = useCallback(async (): Promise<boolean> => {
    if (!myReservation) return false;
    return await reserveSlot(myReservation);
  }, [myReservation, reserveSlot]);

  return {
    reserveSlot,
    releaseSlot,
    isSlotReserved,
    renewReservation,
    myReservation,
    isConnected: channel?.state === 'joined',
  };
};
