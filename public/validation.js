// Test that a password meets the requirements
// Returns error message or null if password is valid
module.exports.validatePassword = (str) => {
  let trimmed = (str+'').trim();
  if (trimmed.length < 8) {
    return "Password is too short."
  }
  return null;
}

// Test that a username meets the requirements
// Returns error message or null if username is valid
module.exports.validateUsername = (str) => {
  let trimmed = (str+'').trim();
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
