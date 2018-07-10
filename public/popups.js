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
  domData.$frButton = jQueryFind('#fr-open');
  domData.$dmButton = jQueryFind('#dm-open');
  domData.$frPopup = jQueryFind('.friend-invite.popup');
  domData.$dmPopup = jQueryFind('.direct-message.popup');
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

// To run after page loads
const runOnReady = () => {
  findDomRefs();

  // Add button listeners
  if (domData.$frButton) {
    domData.$frButton.on('click', {popup: domData.$frPopup}, openPopup);
  }
  if (domData.$dmButton) {
    domData.$dmButton.on('click', {popup: domData.$dmPopup}, openPopup);
  }
  $('.close-popup').on('click', closePopups);

  // Handle key presses
  $(document).on('keydown', keyListener);
}

// Run when the page is done loading
$(runOnReady);
