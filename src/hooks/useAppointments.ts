import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types/Appointment';
import { useAuth } from './useAuth';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  const API_URL = '/api/appointments';

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      // Convert date strings to Date objects
      const formattedData = data.map((appt: any) => ({
        ...appt,
        start: new Date(appt.start),
        end: new Date(appt.end),
      }));
      setAppointments(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, fetchAppointments]);

  const addAppointment = async (newEvent: Omit<Appointment, 'id'>) => {
    if (!token) return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      const data = await response.json();
      const createdAppointment = {
        ...data,
        start: new Date(data.start),
        end: new Date(data.end),
      };

      setAppointments(prev => [...prev, createdAppointment]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateAppointment = async (updatedEvent: Appointment) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/${updatedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      const data = await response.json();
      const updatedAppointment = {
        ...data,
        start: new Date(data.start),
        end: new Date(data.end),
      };

      setAppointments(prev => 
        prev.map(event => (event.id === updatedEvent.id ? updatedAppointment : event))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteAppointment = async (eventId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      setAppointments(prev => prev.filter(event => event.id !== eventId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { appointments, loading, error, addAppointment, updateAppointment, deleteAppointment };
};
