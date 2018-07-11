const domObj = {}; // Object to store dom references

// Retrieve a dom reference or null
const jQueryFinder = (str) => {
  let domRef = $(str);
  if (domRef.length > 0) {
    return domRef;
  }
  return null;
}

// This only needs to happen once
const initDomRefs = () => {
  // Initialize the state data that will never change after initial load
  // Auth related
  domObj.$loginErr = jQueryFinder('#login-error');
  domObj.$loginUser = jQueryFinder('#login-user');
  domObj.$loginPass = jQueryFinder('#login-pass');
  domObj.$loginSubmit = jQueryFinder('#login-submit');
  // Edit related
  domObj.$friendsError = jQueryFinder('#friends-error');
  domObj.$allFriends = jQueryFinder('#all-friends');
  domObj.$friendsSubmit = jQueryFinder('#clean-friends');
  domObj.$blacklistError = jQueryFinder('#blacklist-error');
  domObj.$allBlacklist = jQueryFinder('#all-blacklist');
  domObj.$blacklistSubmit = jQueryFinder('#clean-blacklist');
  domObj.$passChangeErr = jQueryFinder('#pass-change-error');
  domObj.$passOld = jQueryFinder('#pass-current');
  domObj.$passNew = jQueryFinder('#pass-set');
  domObj.$passConfirm = jQueryFinder('#pass-confirm');
  domObj.$passSubmit = jQueryFinder('#pass-change');
  domObj.$deleteSubmit = jQueryFinder('#delete-account');
  // Message related
  domObj.$frError = jQueryFinder('#fr-error');
  domObj.$frMessage = jQueryFinder('#fr-message');
  domObj.$frSubmit = jQueryFinder('#fr-submit');
  domObj.$dmError = jQueryFinder('#dm-error');
  domObj.$dmRecipient = jQueryFinder('#dm-recipient');
  domObj.$dmMessage = jQueryFinder('#dm-message');
  domObj.$dmSubmit = jQueryFinder('#dm-submit');
  // Posts will have to be dynamic as there might be more than one on a page
}

// Validate login/registration form
const validateLogin = () => {
  let userError = validateUsername(domObj.$loginUser.val());
  if (userError) {
    domObj.$loginErr.text(userError);
    return false;
  }
  let passError = validatePassword(domObj.$loginPass.val());
  if (passError) {
    domObj.$loginErr.text(passError);
    return false;
  }
  // Passed all the client side checks
  return true;
}

// Validate user/blacklist cleanup form
const validateSomeChecked = (event) => {
  let $button = $(event.currentTarget);
  let $checkboxParent = event.data.boxes;
  let $errDiv = event.data.errDiv;
  let atLeastOne = false;
  $checkboxParent.find($('input[type="checkbox"]')).each(function() {
    if ($(this).prop('checked')) atLeastOne = true;
  });
  if (!atLeastOne) {
    $errDiv.text("Must select at least one member");
    return false;
  }
  // Passed all the client side checks
  return true;
}

// Validate password change form
const validatePassChange = () => {
  if (validateNotEmpty(domObj.$passOld.val())) {
    domObj.$passChangeErr.text('Must provide existing password.');
    return false;
  }
  let newVal = domObj.$passNew.val();
  let passError = validatePassword(newVal);
  if (passError) {
    domObj.$passChangeErr.text(passError);
    return false;
  }
  let confirmVal = domObj.$passConfirm.val();
  if (validateNotEmpty(confirmVal) || newVal.trim()!=confirmVal.trim()) {
    domObj.$passChangeErr.text('Confirmation password does not match.');
    return false;
  }
  // Passed all the client side checks
  return true;
}

// confirm that the user really wants to delete their account
const confirmAccountDelete = () => {
  return confirm('Are you sure you want to delete your account?');
}

// Validate friend request form
const validateFriendRequest = () => {
  if (validateNotEmpty(domObj.$frMessage.val())) {
    domObj.$frError.text('Must include some text with your friend request.');
    return false;
  }
  // Passed all the client side checks
  return true;
}

// Validate direct message form
const validateDirectMessage = () => {
  if (validateNotEmpty(domObj.$dmRecipient.val())) {
    domObj.$dmError.text('Must provide a recipient.');
    return false;
  }
  if (validateNotEmpty(domObj.$dmMessage.val())) {
    domObj.$dmError.text('Must include some text in your message.');
    return false;
  }
  // Passed all the client side checks
  return true;
}

// Validate post form
const validatePost = (event) => {
  let $form = $(event.currentTarget).closest('form');
  if (validateNotEmpty($form.find('.post-content').val())) {
    $form.find('.post-error').text('Your post must have some content.');
    return false;
  }
  // Passed all the client side checks
  return true;
}

// To run after page loads
const inputCheckRunOnReady = () => {
  initDomRefs();

  // Add listeners to the buttons
  if (domObj.$loginSubmit) {
    domObj.$loginSubmit.on('click', validateLogin);
  }
  if (domObj.$friendsSubmit) {
    domObj.$friendsSubmit.on(
      'click',
      {boxes: domObj.$allFriends, errDiv: domObj.$friendsError},
      validateSomeChecked
    );
  }
  if (domObj.$blacklistSubmit) {
    domObj.$blacklistSubmit.on(
      'click',
      {boxes: domObj.$allBlacklist, errDiv: domObj.$blacklistError},
     validateSomeChecked
   );
  }
  if (domObj.$passSubmit) {
    domObj.$passSubmit.on('click', validatePassChange);
  }
  if (domObj.$deleteSubmit) {
    domObj.$deleteSubmit.on('click', confirmAccountDelete);
  }
  if (domObj.$frSubmit) {
    domObj.$frSubmit.on('click', validateFriendRequest);
  }
  if (domObj.$dmSubmit) {
    domObj.$dmSubmit.on('click', validateDirectMessage);
  }
  // There could be 0-2 post forms on the page
  $('.post-submit').on('click', validatePost);
}

// Run when the page is done loading
$(inputCheckRunOnReady);
