import React, { createContext, useContext, useEffect, useState } from 'react';
import moment from 'moment';
import 'moment/locale/fa';

export type Language = 'fa' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  fa: {
    // Navigation
    'nav.dashboard': 'داشبورد',
    'nav.kanban': 'کانبان',
    'nav.analytics': 'تحلیل‌ها',
    'nav.members': 'اعضا',
    'nav.calendar': 'تقویم',
    'nav.settings': 'تنظیمات',
    'nav.logout': 'خروج',
    'nav.inviteUsers': 'دعوت کاربران',
    'nav.viewInvitations': 'مشاهده دعوت‌نامه‌ها',
    'nav.preferences': 'تنظیمات',

    // Settings
    'settings.title': 'تنظیمات',
    'settings.subtitle': 'مدیریت پروفایل و اطلاعات رزومه شما',
    'settings.resumeSection': 'رزومه و سی‌وی',
    'settings.resumeDescription': 'فایل رزومه خود را آپلود کنید یا جزئیات سی‌وی را بنویسید',
    'settings.uploadFile': 'آپلود فایل رزومه',
    'settings.writeResume': 'نوشتن رزومه',
    'settings.dragDropFile': 'فایل رزومه خود را اینجا بکشید و رها کنید، یا',
    'settings.browseFiles': 'مرور فایل‌ها',
    'settings.supportedFormats': 'فرمت‌های پشتیبانی شده: PDF، DOC، DOCX، TXT، تصاویر (حداکثر ۵ مگابایت)',
    'settings.edit': 'ویرایش',
    'settings.cancel': 'لغو',
    'settings.save': 'ذخیره',
    'settings.download': 'دانلود',
    'settings.remove': 'حذف',
    'settings.uploaded': 'آپلود شده',
    'settings.showPreview': 'نمایش پیش‌نمایش',
    'settings.hidePreview': 'مخفی کردن پیش‌نمایش',
    'settings.resumePreview': 'پیش‌نمایش رزومه',
    'settings.noResumeText': 'هنوز متن رزومه‌ای اضافه نشده است. روی ویرایش کلیک کنید تا جزئیات رزومه خود را اضافه کنید.',
    'settings.resumePlaceholder': 'جزئیات رزومه خود را اینجا بنویسید...\n\nشامل:\n• خلاصه حرفه‌ای\n• تجربه کاری\n• تحصیلات\n• مهارت‌ها\n• دستاورد‌ها',
    'settings.resumeSaved': 'رزومه با موفقیت ذخیره شد!',
    'settings.invalidFileType': 'لطفاً یک فایل PDF، تصویر، متن یا سند آپلود کنید',
    'settings.fileTooLarge': 'حجم فایل باید کمتر از ۵ مگابایت باشد',

    // Calendar
    'calendar.today': 'امروز',
    'calendar.previous': 'قبلی',
    'calendar.next': 'بعدی',
    'calendar.month': 'ماه',
    'calendar.week': 'هفته',
    'calendar.day': 'روز',
    'calendar.agenda': 'برنامه',
    'calendar.date': 'تاریخ',
    'calendar.time': 'زمان',
    'calendar.event': 'رویداد',

    // Dashboard
    'dashboard.title': 'بردهای من',
    'dashboard.subtitle': 'مدیریت و سازماندهی بردهای کانبان شما',
    'dashboard.newBoard': 'برد جدید',
    'dashboard.inviteUsers': 'دعوت کاربران',
    'dashboard.searchBoards': 'جستجو در بردها...',
    'dashboard.allBoards': 'همه بردها',
    'dashboard.ownedByMe': 'متعلق به من',
    'dashboard.memberOf': 'عضو در',
    'dashboard.noBoards': 'برد یافت نشد',
    'dashboard.noDescription': 'بدون توضیح',
    'dashboard.members': 'عضو',
    'dashboard.updated': 'به‌روزرسانی',
    'dashboard.createFirstBoard': 'اولین برد را بسازید',

    // Board Management
    'board.edit': 'ویرایش',
    'board.delete': 'حذف',
    'board.deleteConfirm': 'آیا از حذف "{title}" اطمینان دارید؟ این عمل قابل برگشت نیست.',
    'board.selectBoard': 'انتخاب برد',
    'board.createBoard': 'ایجاد برد',
    'board.privacySettings': 'تنظیمات حریم خصوصی',
    'board.privacyNote': 'برد شما به‌طور پیش‌فرض خصوصی خواهد بود. پس از ایجاد می‌توانید اعضای تیم را دعوت کنید.',
    'board.owner': 'مالک',
    'board.admin': 'مدیر',
    'board.member': 'عضو',
    'board.viewer': 'مشاهده‌گر',

    // Task Management
    'task.todo': 'انجام دادنی',
    'task.inprogress': 'در حال انجام',
    'task.done': 'انجام شده',
    'task.addTask': 'افزودن وظیفه',
    'task.editTask': 'ویرایش وظیفه',
    'task.createTask': 'ایجاد وظیفه جدید',
    'task.title': 'عنوان',
    'task.description': 'توضیحات',
    'task.priority': 'اولویت',
    'task.status': 'وضعیت',
    'task.category': 'دسته‌بندی',
    'task.tags': 'برچسب‌ها',
    'task.assignTo': 'واگذاری به',
    'task.estimatedHours': 'ساعت تخمینی',
    'task.unassigned': 'واگذار نشده',
    'task.addTag': 'افزودن',
    'task.dropHere': 'وظایف را اینجا رها کنید یا + را کلیک کنید',

    // Priority
    'priority.low': 'کم',
    'priority.medium': 'متوسط',
    'priority.high': 'زیاد',

    // Forms
    'form.save': 'ذخیره',
    'form.cancel': 'لغو',
    'form.close': 'بستن',
    'form.required': 'ضروری',
    'form.email': 'ایمیل',
    'form.password': 'کلمه عبور',
    'form.name': 'نام',
    'form.enterTitle': 'عنوان را وارد کنید...',
    'form.addDescription': 'توضیح اضافه کنید...',
    'form.selectAssignee': 'انتخاب مسئول...',
    'form.saveChanges': 'ذخیره تغییرات',

    // Authentication
    'auth.login': 'ورود',
    'auth.register': 'ثبت‌نام',
    'auth.logout': 'خروج',
    'auth.welcome': 'خوش آمدید',
    'auth.loginSubtitle': 'وارد حساب کاربری خود شوید',
    'auth.registerSubtitle': 'حساب کاربری جدید ایجاد کنید',
    'auth.email': 'آدرس ایمیل',
    'auth.password': 'کلمه عبور',
    'auth.name': 'نام کامل',
    'auth.showPassword': 'نمایش کلمه عبور',
    'auth.hidePassword': 'مخفی کردن کلمه عبور',
    'auth.noAccount': 'حساب کاربری ندارید؟',
    'auth.hasAccount': 'حساب کاربری دارید؟',
    'auth.invalidCredentials': 'اطلاعات ورود نامعتبر',
    'auth.registrationFailed': 'ثبت‌نام ناموفق',
    'auth.noPermission': 'شما اجازه انجام این عمل را ندارید',
    'auth.selectBoard': 'لطفاً ابتدا یک برد انتخاب یا ایجاد کنید',

    // Invitations
    'invite.title': 'دعوت اعضای تیم',
    'invite.subtitle': 'افراد را برای همکاری در بردهایتان اضافه کنید',
    'invite.sendInvitation': 'ارسال دعوت‌نامه',
    'invite.addAnother': 'افزودن دعوت‌نامه دیگر',
    'invite.emailAddress': 'آدرس ایمیل',
    'invite.board': 'برد',
    'invite.role': 'نقش',
    'invite.sending': 'در حال ارسال...',
    'invite.howItWorks': 'نحوه کار دعوت‌نامه‌ها:',
    'invite.worksList1': '• کاربران دعوت‌شده ایمیل دریافت می‌کنند',
    'invite.worksList2': '• آنها می‌توانند دعوت را بپذیرند یا رد کنند',
    'invite.worksList3': '• دعوت‌نامه‌ها پس از ۷ روز منقضی می‌شوند',
    'invite.worksList4': '• می‌توانید دعوت‌نامه‌ها را در بخش اعضا مدیریت کنید',

    // Role descriptions
    'role.viewer.desc': 'فقط مشاهده وظایف',
    'role.member.desc': 'ایجاد و ویرایش وظایف',
    'role.admin.desc': 'دسترسی کامل به جز حذف برد',

    // Notifications
    'notification.boardInvitations': 'دعوت‌نامه‌های برد',
    'notification.invitedToCollaborate': 'برای همکاری در این بردها دعوت شده‌اید',
    'notification.invitedBy': 'دعوت از',
    'notification.accept': 'پذیرش',
    'notification.decline': 'رد',
    'notification.daysLeft': 'روز باقیمانده',
    'notification.expired': 'منقضی شده',

    // Search and Filter
    'search.placeholder': 'جستجو...',
    'search.allPriorities': 'همه اولویت‌ها',
    'search.highPriority': 'اولویت زیاد',
    'search.mediumPriority': 'اولویت متوسط',
    'search.lowPriority': 'اولویت کم',
    'search.allCategories': 'همه دسته‌بندی‌ها',
    'search.allAssignees': 'همه مسئولان',
    'search.clearFilters': 'پاک کردن فیلترها',

    // AI Assistant
    'ai.title': 'دستیار هوشمند',
    'ai.placeholder': 'پیام خود را بنویسید...',
    'ai.send': 'ارسال',
    'ai.listening': 'در حال گوش دادن...',
    'ai.speak': 'صحبت کنید',

    // Analytics
    'analytics.title': 'تحلیل عملکرد',
    'analytics.subtitle': 'بهره‌وری و عملکرد خود را ردیابی کنید',
    'analytics.totalTasks': 'کل وظایف',
    'analytics.completed': 'انجام شده',
    'analytics.inProgress': 'در حال انجام',
    'analytics.todo': 'انجام دادنی',
    'analytics.completionRate': 'نرخ تکمیل',
    'analytics.avgCompletionTime': 'میانگین زمان تکمیل',
    'analytics.productivityScore': 'امتیاز بهره‌وری',
    'analytics.weeklyProgress': 'پیشرفت هفتگی',
    'analytics.categoryBreakdown': 'تفکیک دسته‌بندی',
    'analytics.priorityDistribution': 'توزیع اولویت',

    // Member Management
    'members.title': 'اعضای تیم',
    'members.inviteMember': 'دعوت عضو',
    'members.pendingInvitations': 'دعوت‌نامه‌های در انتظار',
    'members.membersList': 'لیست اعضا',

    // Common
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا رخ داد',
    'common.success': 'موفقیت‌آمیز',
    'common.confirm': 'تأیید',
    'common.yes': 'بله',
    'common.no': 'خیر',
    'common.or': 'یا',
    'common.and': 'و',
    'common.invitations': 'دعوت‌نامه',
    'common.delete': 'حذف',

    // Time
    'time.hours': 'ساعت',
    'time.days': 'روز',
    'time.weeks': 'هفته',
    'time.months': 'ماه',

    // Theme
    'theme.light': 'روشن',
    'theme.dark': 'تیره',
    'theme.toggle': 'تغییر حالت',

    // Language
    'language.persian': 'فارسی',
    'language.english': 'English',
    'language.switch': 'تغییر زبان',

    // Chat
    'chat.title': 'چت',
    'chat.members': 'اعضا',
    'chat.conversations': 'مکالمات',
    'chat.noConversations': 'مکالمه‌ای یافت نشد',
    'chat.addMembers': 'افزودن اعضا',
    'chat.showMembers': 'نمایش اعضا',
    'chat.online': 'آنلاین',
    'chat.offline': 'آفلاین',
    'chat.noMessages': 'پیامی وجود ندارد',
    'chat.startConversation': 'مکالمه را شروع کنید!',
    'chat.typeMessage': 'پیام خود را بنویسید...',
    'chat.typing': 'در حال تایپ...',
    'chat.noMembers': 'عضوی یافت نشد',
    'chat.sendMessage': 'ارسال پیام',
    'chat.addEmoji': 'افزودن ایموجی',
    'chat.attachFile': 'ضمیمه فایل',
    'chat.searchChannels': 'جستجوی کانال‌ها...',
    'chat.searchUsers': 'جستجوی کاربران',
    'chat.searchPlaceholder': 'نام یا ایمیل کاربر را جستجو کنید...',
    'chat.searchHint': 'حداقل ۲ کاراکتر وارد کنید',
    'chat.noResults': 'کاربری یافت نشد',
    'chat.copyMessage': 'کپی پیام',
    'chat.reply': 'پاسخ',
    'chat.you': 'شما',
    'chat.fileTooLarge': 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد',
    'chat.addCaption': 'عنوان برای فایل اضافه کنید...',
    'chat.downloadFile': 'دانلود فایل',
    'chat.sendError': 'خطا در ارسال پیام. لطفا دوباره تلاش کنید.',

    // Columns
    'column.addColumn': 'افزودن ستون',

    // Invite
    'invite.sent': 'دعوت‌نامه ارسال شد',
    'invite.failed': 'ارسال دعوت‌نامه ناموفق بود',
    'invite.invite': 'دعوت',
    'invite.alreadyMember': 'عضو است',

    // Board Settings
    'boardSettings.title': 'تنظیمات برد',
    'boardSettings.ownerOnly': 'فقط صاحبان برد می‌توانند این تنظیمات را پیکربندی کنند.',
    'boardSettings.llm.title': 'تولید وظیفه با هوش مصنوعی',
    'boardSettings.llm.provider': 'ارائه‌دهنده LLM',
    'boardSettings.llm.selectProvider': 'یک ارائه‌دهنده انتخاب کنید',
    'boardSettings.llm.apiKey': 'کلید API',
    'boardSettings.llm.apiKeySet': 'کلید API قبلاً پیکربندی شده است',
    'boardSettings.llm.enterApiKey': 'کلید API خود را وارد کنید',
    'boardSettings.llm.openaiKeyHelp': 'کلید API خود را از platform.openai.com دریافت کنید',
    'boardSettings.llm.openrouterKeyHelp': 'کلید API خود را از openrouter.ai دریافت کنید',
    'boardSettings.llm.model': 'مدل',
    'boardSettings.llm.selectModel': 'یک مدل انتخاب کنید',
    'boardSettings.llm.searchModelPlaceholder': 'نام مدل را جستجو کنید...',
    'boardSettings.llm.enterApiKeyToSearch': 'برای جستجوی مدل‌ها، کلید API را وارد کنید یا از کلید ذخیره‌شده استفاده کنید',
    'boardSettings.llm.typeToSearch': 'برای جستجو حداقل ۲ کاراکتر تایپ کنید',
    'boardSettings.llm.searching': 'در حال جستجوی مدل‌ها...',
    'boardSettings.llm.enableLLM': 'فعال‌سازی تولید وظیفه با هوش مصنوعی',
    'boardSettings.llm.saveConfig': 'ذخیره پیکربندی',
    'boardSettings.llm.generateTasks': 'تولید وظایف',
    'boardSettings.llm.configSaved': 'پیکربندی با موفقیت ذخیره شد',
    'boardSettings.llm.saveFailed': 'ذخیره پیکربندی ناموفق بود',
    'boardSettings.llm.generateFailed': 'تولید وظایف ناموفق بود',
    'boardSettings.llm.providerModelRequired': 'لطفاً یک ارائه‌دهنده و مدل انتخاب کنید',
    'boardSettings.llm.apiKeyRequired': 'کلید API الزامی است',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.kanban': 'Kanban',
    'nav.analytics': 'Analytics',
    'nav.members': 'Members',
    'nav.calendar': 'Calendar',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.inviteUsers': 'Invite Users',
    'nav.viewInvitations': 'View Invitations',
    'nav.preferences': 'Preferences',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your profile and resume information',
    'settings.resumeSection': 'Resume & Profile',
    'settings.uploadResume': 'Upload Resume',
    'settings.writeResume': 'Write Resume',
    'settings.resumePlaceholder': 'Write your resume here or paste from another document...',
    'settings.supportedFormats': 'Supported: PDF, DOC, DOCX, TXT, Images (max 5MB)',
    'settings.dragDropText': 'Drag and drop your resume file here',
    'settings.orText': 'or',
    'settings.browseFiles': 'Browse Files',
    'settings.preview': 'Preview',
    'settings.hidePreview': 'Hide Preview',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.saved': 'Saved!',
    'settings.errorSaving': 'Error saving',
    'settings.removeFile': 'Remove File',
    'settings.uploadedFile': 'Uploaded File',
    'settings.resumePreview': 'Resume Preview',
    'settings.resumeSaved': 'Resume saved successfully!',
    'settings.invalidFileType': 'Please upload a PDF, image, text file, or document',
    'settings.fileTooLarge': 'File size must be less than 5MB',

    // Board Settings
    'boardSettings.title': 'Board Settings',
    'boardSettings.ownerOnly': 'Only board owners can configure these settings.',
    'boardSettings.llm.title': 'AI Task Generation',
    'boardSettings.llm.provider': 'LLM Provider',
    'boardSettings.llm.selectProvider': 'Select a provider',
    'boardSettings.llm.apiKey': 'API Key',
    'boardSettings.llm.apiKeySet': 'API key is already configured',
    'boardSettings.llm.enterApiKey': 'Enter your API key',
    'boardSettings.llm.openaiKeyHelp': 'Get your API key from platform.openai.com',
    'boardSettings.llm.openrouterKeyHelp': 'Get your API key from openrouter.ai',
    'boardSettings.llm.model': 'Model',
    'boardSettings.llm.selectModel': 'Select a model',
    'boardSettings.llm.searchModelPlaceholder': 'Search model name...',
    'boardSettings.llm.enterApiKeyToSearch': 'Enter API key or use the stored key to search models',
    'boardSettings.llm.typeToSearch': 'Type at least 2 characters to search',
    'boardSettings.llm.searching': 'Searching models...',
    'boardSettings.llm.enableLLM': 'Enable AI task generation',
    'boardSettings.llm.saveConfig': 'Save Configuration',
    'boardSettings.llm.generateTasks': 'Generate Tasks',
    'boardSettings.llm.configSaved': 'Configuration saved successfully',
    'boardSettings.llm.saveFailed': 'Failed to save configuration',
    'boardSettings.llm.generateFailed': 'Failed to generate tasks',
    'boardSettings.llm.providerModelRequired': 'Please select a provider and model',
    'boardSettings.llm.apiKeyRequired': 'API key is required',

    // Calendar
    'calendar.today': 'Today',
    'calendar.previous': 'Previous',
    'calendar.next': 'Next',
    'calendar.month': 'Month',
    'calendar.week': 'Week',
    'calendar.day': 'Day',
    'calendar.agenda': 'Agenda',
    'calendar.date': 'Date',
    'calendar.time': 'Time',
    'calendar.event': 'Event',

    // Dashboard
    'dashboard.title': 'My Boards',
    'dashboard.subtitle': 'Manage and organize your kanban boards',
    'dashboard.newBoard': 'New Board',
    'dashboard.inviteUsers': 'Invite Users',
    'dashboard.searchBoards': 'Search boards...',
    'dashboard.allBoards': 'All Boards',
    'dashboard.ownedByMe': 'Owned by Me',
    'dashboard.memberOf': 'Member Of',
    'dashboard.noBoards': 'No boards found',
    'dashboard.noDescription': 'No description',
    'dashboard.members': 'members',
    'dashboard.updated': 'Updated',
    'dashboard.createFirstBoard': 'Create First Board',

    // Board Management
    'board.edit': 'Edit',
    'board.delete': 'Delete',
    'board.deleteConfirm': 'Are you sure you want to delete "{title}"? This action cannot be undone.',
    'board.selectBoard': 'Select Board',
    'board.createBoard': 'Create Board',
    'board.privacySettings': 'Privacy Settings',
    'board.privacyNote': 'Your board will be private by default. You can invite team members after creation.',
    'board.owner': 'owner',
    'board.admin': 'admin',
    'board.member': 'member',
    'board.viewer': 'viewer',

    // Task Management
    'task.todo': 'To Do',
    'task.inprogress': 'In Progress',
    'task.done': 'Done',
    'task.addTask': 'Add Task',
    'task.editTask': 'Edit Task',
    'task.createTask': 'Create New Task',
    'task.title': 'Title',
    'task.description': 'Description',
    'task.priority': 'Priority',
    'task.status': 'Status',
    'task.category': 'Category',
    'task.tags': 'Tags',
    'task.assignTo': 'Assign to',
    'task.estimatedHours': 'Estimated Hours',
    'task.unassigned': 'Unassigned',
    'task.addTag': 'Add',
    'task.dropHere': 'Drop tasks here or click +',

    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',

    // Forms
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.close': 'Close',
    'form.required': 'Required',
    'form.email': 'Email',
    'form.password': 'Password',
    'form.name': 'Name',
    'form.enterTitle': 'Enter title...',
    'form.addDescription': 'Add a description...',
    'form.selectAssignee': 'Select assignee...',
    'form.saveChanges': 'Save Changes',

    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.welcome': 'Welcome',
    'auth.loginSubtitle': 'Sign in to your account',
    'auth.registerSubtitle': 'Create a new account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.showPassword': 'Show password',
    'auth.hidePassword': 'Hide password',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.invalidCredentials': 'Invalid credentials',
    'auth.registrationFailed': 'Registration failed',
    'auth.noPermission': 'You do not have permission to perform this action',
    'auth.selectBoard': 'Please select or create a board first',

    // Invitations
    'invite.title': 'Invite Team Members',
    'invite.subtitle': 'Add people to collaborate on your boards',
    'invite.sendInvitation': 'Send Invitation',
    'invite.addAnother': 'Add Another Invitation',
    'invite.emailAddress': 'Email Address',
    'invite.board': 'Board',
    'invite.role': 'Role',
    'invite.sending': 'Sending...',
    'invite.howItWorks': 'How invitations work:',
    'invite.worksList1': '• Invited users will receive an email notification',
    'invite.worksList2': '• They can accept or decline the invitation',
    'invite.worksList3': '• Invitations expire after 7 days',
    'invite.worksList4': '• You can manage invitations in the Members tab',

    // Role descriptions
    'role.viewer.desc': 'Can view tasks only',
    'role.member.desc': 'Can create and edit tasks',
    'role.admin.desc': 'Full access except board deletion',

    // Notifications
    'notification.boardInvitations': 'Board Invitations',
    'notification.invitedToCollaborate': "You've been invited to collaborate on these boards",
    'notification.invitedBy': 'Invited by',
    'notification.accept': 'Accept',
    'notification.decline': 'Decline',
    'notification.daysLeft': 'days left',
    'notification.expired': 'Expired',

    // Search and Filter
    'search.placeholder': 'Search...',
    'search.allPriorities': 'All Priorities',
    'search.highPriority': 'High Priority',
    'search.mediumPriority': 'Medium Priority',
    'search.lowPriority': 'Low Priority',
    'search.allCategories': 'All Categories',
    'search.allAssignees': 'All Assignees',
    'search.clearFilters': 'Clear Filters',

    // AI Assistant
    'ai.title': 'AI Assistant',
    'ai.placeholder': 'Type your message...',
    'ai.send': 'Send',
    'ai.listening': 'Listening...',
    'ai.speak': 'Speak',

    // Analytics
    'analytics.title': 'Performance Analytics',
    'analytics.subtitle': 'Track your productivity and performance',
    'analytics.totalTasks': 'Total Tasks',
    'analytics.completed': 'Completed',
    'analytics.inProgress': 'In Progress',
    'analytics.todo': 'To Do',
    'analytics.completionRate': 'Completion Rate',
    'analytics.avgCompletionTime': 'Avg Completion Time',
    'analytics.productivityScore': 'Productivity Score',
    'analytics.weeklyProgress': 'Weekly Progress',
    'analytics.categoryBreakdown': 'Category Breakdown',
    'analytics.priorityDistribution': 'Priority Distribution',

    // Member Management
    'members.title': 'Team Members',
    'members.inviteMember': 'Invite Member',
    'members.pendingInvitations': 'Pending Invitations',
    'members.membersList': 'Members List',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.or': 'or',
    'common.and': 'and',
    'common.invitations': 'invitations',
    'common.delete': 'Delete',

    // Time
    'time.hours': 'hours',
    'time.days': 'days',
    'time.weeks': 'weeks',
    'time.months': 'months',

    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.toggle': 'Toggle Theme',

    // Language
    'language.persian': 'فارسی',
    'language.english': 'English',
    'language.switch': 'Switch Language',

    // Chat
    'chat.title': 'Chat',
    'chat.members': 'Members',
    'chat.conversations': 'Conversations',
    'chat.noConversations': 'No conversations found',
    'chat.addMembers': 'Add Members',
    'chat.showMembers': 'Show Members',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.noMessages': 'No messages yet',
    'chat.startConversation': 'Start the conversation!',
    'chat.typeMessage': 'Type your message...',
    'chat.typing': 'Typing...',
    'chat.noMembers': 'No members found',
    'chat.sendMessage': 'Send message',
    'chat.addEmoji': 'Add emoji',
    'chat.attachFile': 'Attach file',
    'chat.fileTooLarge': 'File is too large (max 10MB)',
    'chat.copyMessage': 'Copy message',
    'chat.reply': 'Reply',
    'chat.you': 'You',
    'chat.searchChannels': 'Search channels...',
    'chat.searchUsers': 'Search users',
    'chat.searchPlaceholder': 'Search by name or email...',
    'chat.searchHint': 'Type at least 2 characters to search',
    'chat.noResults': 'No users found',
    'chat.addCaption': 'Add a caption...',
    'chat.downloadFile': 'Download File',
    'chat.sendError': 'Error sending message. Please try again.',

    // Columns
    'column.addColumn': 'Add Column',

    // Invite
    'invite.sent': 'Invitation sent',
    'invite.failed': 'Failed to send invitation',
    'invite.invite': 'Invite',
    'invite.alreadyMember': 'Already member',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language') as Language;
    return savedLang || 'fa'; // Default to Persian
  });

  const isRTL = language === 'fa';

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  useEffect(() => {
    // Update moment.js locale for date formatting across the app
    moment.locale(language === 'fa' ? 'fa' : 'en');
    const root = document.documentElement;
    
    if (isRTL) {
      root.setAttribute('dir', 'rtl');
      root.style.fontFamily = 'Vazirmatn, system-ui, -apple-system, sans-serif';
    } else {
      root.setAttribute('dir', 'ltr');
      root.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
    }
  }, [isRTL]);

  const value = {
    language,
    setLanguage: handleSetLanguage,
    isRTL,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 