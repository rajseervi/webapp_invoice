export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};