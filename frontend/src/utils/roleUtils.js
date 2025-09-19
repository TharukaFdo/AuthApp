export const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#dc3545';
    case 'moderator': return '#fd7e14';
    case 'user': return '#198754';
    default: return '#6c757d';
  }
};