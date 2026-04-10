/* Loading Spinner — Vitimex POS (Medstand Pattern) */
var $spinner = $('#global-spinner');
var _spinnerCount = 0;

function showGlobalSpinner() {
  if (!$spinner.length) $spinner = $('#global-spinner');
  _spinnerCount++;
  console.log('[Spinner] SHOW | Counter:', _spinnerCount);
  $spinner.removeAttr('hidden').show();
}

function hideGlobalSpinner() {
  if (!$spinner.length) $spinner = $('#global-spinner');
  _spinnerCount = Math.max(0, _spinnerCount - 1);
  console.log('[Spinner] HIDE | Counter:', _spinnerCount);
  if (_spinnerCount === 0) {
    $spinner.attr('hidden', '').hide();
  }
}
