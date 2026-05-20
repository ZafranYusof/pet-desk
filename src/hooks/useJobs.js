import { useEffect } from 'react';
import { checkJobComplete } from '../services/jobService';

export function useJobs() {
  // Check job completion every 60 seconds
  useEffect(() => {
    const jobStatus = checkJobComplete();
    if (jobStatus && jobStatus.complete) {
      if (window.electronAPI?.showNotification) {
        window.electronAPI.showNotification('💼 Job shift complete! Collect your reward.');
      }
    }

    const interval = setInterval(() => {
      const status = checkJobComplete();
      if (status && status.complete) {
        if (window.electronAPI?.showNotification) {
          window.electronAPI.showNotification('💼 Job shift complete! Collect your reward.');
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);
}
