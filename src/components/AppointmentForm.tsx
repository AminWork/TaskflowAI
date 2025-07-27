import { useState } from 'react';
import { Appointment } from '../types/Appointment';

interface AppointmentFormProps {
  addEvent: (event: Omit<Appointment, 'id'>) => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ addEvent }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && start && end) {
      addEvent({
        title,
        start: new Date(start),
        end: new Date(end),
      });
      setTitle('');
      setStart('');
      setEnd('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 mb-8 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">Add New Appointment</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-3">
          <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g., Project Kick-off Meeting"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>
        <div>
          <label htmlFor="start" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Start Time</label>
          <input
            id="start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>
        <div>
          <label htmlFor="end" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">End Time</label>
          <input
            id="end"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800 transition-all duration-300"
        >
          Add Appointment
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
