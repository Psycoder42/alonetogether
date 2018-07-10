// Object to store static values
const constants = {
  escapeKey: 27
};

const domData = {}; // Object to store dom references

// Retrieve a dom reference or null
const jQueryFind = (str) => {
  let domObj = $(str);
  if (domObj.length > 0) {
    return domObj;
  }
  return null;
}

// This only needs to happen once
const findDomRefs = () => {
  // Initialize the state data that will never change after initial load
  domData.$modal = jQueryFind('#modal');
  // Friend requests
  domData.$frButton = jQueryFind('#fr-open');
  domData.$frPopup = jQueryFind('.friend-invite.popup');
  // Direct messages
  domData.$dmButton = jQueryFind('#dm-open');
  domData.$dmPopup = jQueryFind('.direct-message.popup');
  // Avatar selection
  domData.$avatar = jQueryFind('.avatar');
  domData.$avatarInput = jQueryFind('input[name="profilePic"]');
  domData.$avatarButton = jQueryFind('#change-avatar');
  domData.$avatarPopup = jQueryFind('.pick-avatar.popup');
}

// Close any open popups
const closePopups = () => {
  domData.$modal.addClass('hidden');
  if (domData.$frPopup) domData.$frPopup.addClass('hidden');
  if (domData.$dmPopup) domData.$dmPopup.addClass('hidden');
  return false;
}

// Open a popup
const openPopup = (event) => {
  let toShow = event.data.popup;
  if (toShow) {
    toShow.removeClass('hidden');
    domData.$modal.removeClass('hidden');
  }
}

// Listen for escape key events
const keyListener = (event) => {
  if (event.keyCode === constants.escapeKey) {
    closePopups();
  }
}

// Change the user's avatar based on the selection
const selectAvatar = (event) => {
  let newAvatar = $(event.currentTarget).attr('src');
  domData.$avatar.attr('src', newAvatar);
  domData.$avatarInput.attr('value', newAvatar);
  closePopups();
}

// To run after page loads
const popupsRunOnReady = () => {
  findDomRefs();

  // Add button listeners
  if (domData.$frButton) {
    // Add listener for opening the popup
    domData.$frButton.on('click', {popup: domData.$frPopup}, openPopup);
  }
  if (domData.$dmButton) {
    // Add listener for opening the popup
    domData.$dmButton.on('click', {popup: domData.$dmPopup}, openPopup);
  }
  if (domData.$avatarButton) {
    // Add listener for opening the popup
    domData.$avatarButton.on('click', {popup: domData.$avatarPopup}, openPopup);
    // Add listeners for selecting an avatar
    $('.avatar-option').on('click', selectAvatar);
  }
  $('.close-popup').on('click', closePopups);

  // Handle key presses
  $(document).on('keydown', keyListener);
}

// Run when the page is done loading
$(popupsRunOnReady);
