function is_checked (radio_button) {
  return radio_button.attr('checked') != undefined
}

module.exports = {
  'is_checked' : is_checked
}
