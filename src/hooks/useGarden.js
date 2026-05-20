import { useEffect } from 'react';
import { tickGarden, getGardenNotifications, getGarden } from '../services/gardenService';

export function useGarden() {
  // Tick garden every 60 seconds (check growth, wither, notifications)
  useEffect(() => {
    const interval = setInterval(() => {
      tickGarden();
      const plots = getGarden();
      const notifications = getGardenNotifications(plots);
      notifications.forEach((n) => {
        if (n.type === 'harvest' && window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(`${n.plantEmoji} ${n.plantName} is ready to harvest!`);
        } else if (n.type === 'water' && window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(`${n.plantEmoji} ${n.plantName} needs water! 💧`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);
}
