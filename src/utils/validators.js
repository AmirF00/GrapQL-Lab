const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateInput = ({ email, password, name }) => {
  const errors = [];

  if (email && !validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (password && !validatePassword(password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (name && name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  return errors;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateInput
};
