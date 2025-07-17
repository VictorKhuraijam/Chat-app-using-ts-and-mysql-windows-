export const formatTime = (date: Date | string): string => {
  // const messageDate = new Date(date);
  let messageDate: Date;

  // Handle different date formats
  if (typeof date === 'string') {
    // If it's a string, try to parse it
    messageDate = new Date(date);
  } else if (typeof date === 'number') {
    // If it's a number, treat it as a timestamp
    // Check if it's in seconds (Unix timestamp) or milliseconds
    messageDate = date.toString().length === 10
      ? new Date(date * 1000) // Convert seconds to milliseconds
      : new Date(date);
  } else {
    // If it's already a Date object
    messageDate = date;
  }

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
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};
