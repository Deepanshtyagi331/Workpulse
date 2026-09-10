/**
 * Formats an ISO date string into a user-friendly format.
 */
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Capitalizes the first letter of each word.
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates text with an ellipsis if length exceeds max.
 */
export function truncate(text, maxLength = 60) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Returns a human-readable relative time string (e.g. '2h ago', 'Yesterday').
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const diffInSeconds = Math.floor((now - date) / 1000);

  if (Math.abs(diffInSeconds) < 60) return 'Just now';

  if (diffInSeconds > 0) {
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    const futureSec = Math.abs(diffInSeconds);
    const minutes = Math.floor(futureSec / 60);
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Tomorrow';
    return `in ${days}d`;
  }
}
