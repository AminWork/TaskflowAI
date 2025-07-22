import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Target,
  TrendingUp,
  Clock,
  Award,
  Users,
  Calendar,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  weeklyProgress: Array<{
    day: string;
    completed: number;
    created: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
  }>;
  priorityDistribution: Array<{
    name: string;
    value: number;
  }>;
}

interface AnalyticsProps {
  analytics: AnalyticsData;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export function Analytics({ analytics }: AnalyticsProps) {
  const { t, isRTL } = useLanguage();

  const statCards = [
    {
      title: t('analytics.totalTasks'),
      value: analytics.totalTasks,
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('analytics.completionRate'),
      value: `${analytics.completionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      change: '+5.2%',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: t('analytics.avgCompletionTime'),
      value: `${analytics.averageCompletionTime.toFixed(1)}d`,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      change: '-0.8d',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: t('analytics.productivityScore'),
      value: analytics.productivityScore,
      icon: Award,
      color: 'from-orange-500 to-orange-600',
      change: '+8pts',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('analytics.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('analytics.subtitle')}</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
          >
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${stat.textColor} ${stat.bgColor} px-2 py-1 rounded-full`}>
                {stat.change}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-6`}>
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('analytics.weeklyProgress')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }} 
              />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} />
              <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-6`}>
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('analytics.priorityDistribution')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.priorityDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={(entry: any) => `${entry.name} ${(entry.percent ? (entry.percent * 100).toFixed(0) : 0)}%`}
              >
                {analytics.priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 lg:col-span-2"
        >
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-6`}>
            <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('analytics.categoryBreakdown')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }} 
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Task Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-4`}>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.todo')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.todoTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-4`}>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.inProgress')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3 mb-4`}>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.completed')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.completedTasks}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}