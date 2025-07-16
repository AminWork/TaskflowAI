import { Task } from '../types';

export function generateAIResponse(message: string, tasks: Task[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Task creation suggestions
  if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new task')) {
    return "I'd be happy to help you create a new task! You can use voice commands like 'Create a task to review project proposal with high priority' or click the + button to add tasks manually.";
  }
  
  // Task statistics
  if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('how many')) {
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    
    return `Here's your current progress: ${todoCount} tasks to do, ${inProgressCount} in progress, and ${doneCount} completed. You're making great progress!`;
  }
  
  // Priority suggestions
  if (lowerMessage.includes('priority') || lowerMessage.includes('important')) {
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    return highPriorityTasks > 0 
      ? `You have ${highPriorityTasks} high-priority tasks that need attention. Focus on those first!`
      : "Great! You don't have any urgent high-priority tasks right now. Keep up the good work!";
  }
  
  // Productivity tips
  if (lowerMessage.includes('help') || lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
    const tips = [
      "Try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break.",
      "Break large tasks into smaller, manageable subtasks for better progress tracking.",
      "Use the priority system to focus on what matters most each day.",
      "Review your completed tasks weekly to celebrate your achievements!",
      "Consider grouping similar tasks together to improve efficiency."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  // Voice commands help
  if (lowerMessage.includes('voice') || lowerMessage.includes('command')) {
    return "You can use voice commands like: 'Create a task to [description]', 'Show my progress', 'Give me productivity tips', or just ask me anything about your tasks!";
  }
  
  // Default responses
  const responses = [
    "I'm here to help you stay organized and productive! What would you like to work on?",
    "Feel free to ask me about your tasks, productivity tips, or use voice commands to create new tasks.",
    "I can help you manage your tasks more effectively. Try asking about your progress or task priorities!",
    "Let me know how I can assist you with your task management today.",
    "I'm ready to help! You can ask me about your tasks, request productivity advice, or create new tasks using voice commands."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}