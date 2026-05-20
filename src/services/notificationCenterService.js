/**
 * PetDesk - Notification Center Service
 * In-app notification inbox with categories.
 */

const NOTIFICATION_CENTER_KEY = 'petdesk_notification_center';
const MAX_NOTIFICATIONS = 50;

const CATEGORIES = ['system', 'quests', 'events', 'pet', 'garden'];

function loadNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_CENTER_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

function saveNotifications(notifications) {
  try {
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATION_CENTER_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

/**
 * Add a notification to the center.
 */
export function addNotification(title, message, category = 'system', icon = '📢') {
  const notifications = loadNotifications();
  notifications.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    message,
    category,
    icon,
    read: false,
    timestamp: Date.now(),
  });
  saveNotifications(notifications);
}

/**
 * Get all notifications.
 */
export function getNotifications(category = null) {
  const notifications = loadNotifications();
  if (category) {
    return notifications.filter(n => n.category === category);
  }
  return notifications;
}

/**
 * Get unread count.
 */
export function getUnreadCount(category = null) {
  const notifications = loadNotifications();
  if (category) {
    return notifications.filter(n => !n.read && n.category === category).length;
  }
  return notifications.filter(n => !n.read).length;
}

/**
 * Mark a notification as read.
 */
export function markAsRead(notificationId) {
  const notifications = loadNotifications();
  const idx = notifications.findIndex(n => n.id === notificationId);
  if (idx !== -1) {
    notifications[idx].read = true;
    saveNotifications(notifications);
  }
}

/**
 * Mark all notifications as read.
 */
export function markAllAsRead() {
  const notifications = loadNotifications();
  notifications.forEach(n => { n.read = true; });
  saveNotifications(notifications);
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications() {
  saveNotifications([]);
}

/**
 * Delete a single notification.
 */
export function deleteNotification(notificationId) {
  const notifications = loadNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  saveNotifications(filtered);
}

/**
 * Get available categories.
 */
export function getCategories() {
  return CATEGORIES;
}
