import React from 'react';
import { Appointment } from '../types/Appointment';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Clock } from 'lucide-react';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Appointment | null;
  onDelete: (event: Appointment) => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ isOpen, onClose, event, onDelete }) => {
  if (!event) return null;

  const handleDelete = () => {
    onDelete(event);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{event.title}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  <span>{new Date(event.start).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-teal-500" />
                  <span>
                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 transition-all duration-300"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
