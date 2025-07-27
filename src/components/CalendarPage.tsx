import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // Import custom calendar styles
import AppointmentForm from './AppointmentForm';
import { Appointment } from '../types/Appointment';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { useState } from 'react';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const { appointments, loading, error, addAppointment, deleteAppointment } = useAppointments();
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectEvent = (event: Appointment) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventToDelete: Appointment) => {
    if (eventToDelete.id) {
      deleteAppointment(eventToDelete.id);
    }
  };

  const addEvent = (event: Omit<Appointment, 'id'>) => {
    addAppointment(event);
  };

  return (
    <div className="p-4 md:p-8">
      <AppointmentForm addEvent={addEvent} />
      {loading && <p>Loading appointments...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 mt-4" style={{ height: 'calc(100vh - 300px)' }}>
        <Calendar
          localizer={localizer}
          events={appointments}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day']}
          defaultView={Views.MONTH}
          className="h-full"
        />
      </div>
      <AppointmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default CalendarPage;
