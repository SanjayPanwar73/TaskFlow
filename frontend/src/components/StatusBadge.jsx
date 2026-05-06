// src/components/StatusBadge.jsx — Task status badge
export default function StatusBadge({ status }) {
  const classes = {
    'Pending':     'badge-pending',
    'In Progress': 'badge-progress',
    'Completed':   'badge-completed',
  };
  return (
    <span className={classes[status] || 'badge-pending'}>
      {status}
    </span>
  );
}
