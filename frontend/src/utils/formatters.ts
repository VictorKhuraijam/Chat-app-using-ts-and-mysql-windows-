export const formatTime = (date: Date | string | number): string => {
  const messageDate = new Date(date);

  // Check if the date is valid
  if (isNaN(messageDate.getTime())) {
    console.warn('Invalid date provided to formatTime:', date);
    return 'Invalid date';
  }

  const now = new Date();
  const diff = now.getTime() - messageDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days}d ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1w ago' : `${weeks}w ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};
