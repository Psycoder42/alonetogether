// Test that a password meets the requirements
// Returns error message or null if password is valid
const validatePassword = (str) => {
  let trimmed = (str ? str.trim() :'');
  if (trimmed.length < 8) {
    return "Password is too short."
  }
  return null;
}

// Test that a username meets the requirements
// Returns error message or null if username is valid
const validateUsername = (str) => {
  let trimmed = (str ? str.trim() :'');
  let len = trimmed.length;
  if (len < 4) {
    return "Username must be at least 4 characters long."
  }
  if (len > 32) {
    return "Username must be no more than 32 characters long."
  }
  let re = "^[-_\\.a-zA-Z0-9]{"+len+"}$";
  if (!trimmed.match(new RegExp(re))) {
    return "Username does not meet requirements"
  }
  return null;
}

// Test to make sure a string is not all whitespace
// Returns error message or null if string has content
const validateNotEmpty = (str) => {
  let trimmed = (str ? str.trim() :'');
  if (trimmed.length == 0) {
    return "Input can not be empty";
  }
  return null;
}

// Export the functions for use as a module
if (typeof module !== 'undefined') {
  module.exports.validatePassword = validatePassword;
  module.exports.validateUsername = validateUsername;
  module.exports.validateNotEmpty = validateNotEmpty;
}
