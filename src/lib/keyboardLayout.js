/* =============================================================================
 * keyboardLayout.js - data for the on-screen US QWERTY keyboard (full size)
 * -----------------------------------------------------------------------------
 * - Keys are identified by KeyboardEvent.code (the physical key), so the
 *   highlight is correct whatever keyboard layout the computer is set to.
 * - Layout is a CSS grid measured in quarter-key units (1 key = 4 columns).
 *     main block   columns  1-60     navigation cluster columns 63-74
 *     numpad       columns 77-92     rows: 1 function, 2 gap, 3-7 typing rows
 * - Modifier-only presses light up the key but never count as typing.
 * - Caps Lock is *detected* from key events. A web page cannot switch the
 *   physical LEDs, and this keyboard does not pretend to.
 * ========================================================================== */
/* key: [code, label, shiftLabel|null, row, col, colSpan, rowSpan, group] */
var KEYS = [];
function add(code, label, shift, row, col, span, rspan, group) {
  KEYS.push({ code: code, label: label, shift: shift, row: row, col: col, span: span, rspan: rspan || 1, group: group || 'main' });
}

/* Row 1: function keys */
add('Escape', 'Esc', null, 1, 1, 4, 1, 'fn');
['F1', 'F2', 'F3', 'F4'].forEach(function (c, i) { add(c, c, null, 1, 9 + i * 4, 4, 1, 'fn'); });
['F5', 'F6', 'F7', 'F8'].forEach(function (c, i) { add(c, c, null, 1, 27 + i * 4, 4, 1, 'fn'); });
['F9', 'F10', 'F11', 'F12'].forEach(function (c, i) { add(c, c, null, 1, 45 + i * 4, 4, 1, 'fn'); });

/* Row 3: number row */
var NUM = [['Backquote', '`', '~'], ['Digit1', '1', '!'], ['Digit2', '2', '@'], ['Digit3', '3', '#'], ['Digit4', '4', '$'],
  ['Digit5', '5', '%'], ['Digit6', '6', '^'], ['Digit7', '7', '&'], ['Digit8', '8', '*'], ['Digit9', '9', '('],
  ['Digit0', '0', ')'], ['Minus', '-', '_'], ['Equal', '=', '+']];
NUM.forEach(function (k, i) { add(k[0], k[1], k[2], 3, 1 + i * 4, 4); });
add('Backspace', 'Backspace', null, 3, 53, 8);

/* Row 4 */
add('Tab', 'Tab', null, 4, 1, 6);
var TOP = [['KeyQ', 'q'], ['KeyW', 'w'], ['KeyE', 'e'], ['KeyR', 'r'], ['KeyT', 't'], ['KeyY', 'y'], ['KeyU', 'u'], ['KeyI', 'i'],
  ['KeyO', 'o'], ['KeyP', 'p'], ['BracketLeft', '[', '{'], ['BracketRight', ']', '}']];
TOP.forEach(function (k, i) { add(k[0], k[1], k[2] || null, 4, 7 + i * 4, 4); });
add('Backslash', '\\', '|', 4, 55, 6);

/* Row 5 */
add('CapsLock', 'Caps Lock', null, 5, 1, 7);
var HOME = [['KeyA', 'a'], ['KeyS', 's'], ['KeyD', 'd'], ['KeyF', 'f'], ['KeyG', 'g'], ['KeyH', 'h'], ['KeyJ', 'j'], ['KeyK', 'k'],
  ['KeyL', 'l'], ['Semicolon', ';', ':'], ['Quote', "'", '"']];
HOME.forEach(function (k, i) { add(k[0], k[1], k[2] || null, 5, 8 + i * 4, 4); });
add('Enter', 'Enter', null, 5, 52, 9);

/* Row 6 */
add('ShiftLeft', 'Shift', null, 6, 1, 9);
var BOT = [['KeyZ', 'z'], ['KeyX', 'x'], ['KeyC', 'c'], ['KeyV', 'v'], ['KeyB', 'b'], ['KeyN', 'n'], ['KeyM', 'm'],
  ['Comma', ',', '<'], ['Period', '.', '>'], ['Slash', '/', '?']];
BOT.forEach(function (k, i) { add(k[0], k[1], k[2] || null, 6, 10 + i * 4, 4); });
add('ShiftRight', 'Shift', null, 6, 50, 11);

/* Row 7 */
add('ControlLeft', 'Ctrl', null, 7, 1, 5);
add('MetaLeft', 'Win', null, 7, 6, 5);
add('AltLeft', 'Alt', null, 7, 11, 5);
add('Space', '', null, 7, 16, 25);
add('AltRight', 'Alt', null, 7, 41, 5);
add('MetaRight', 'Win', null, 7, 46, 5);
add('ContextMenu', 'Menu', null, 7, 51, 5);
add('ControlRight', 'Ctrl', null, 7, 56, 5);

/* Navigation cluster */
add('Insert', 'Ins', null, 3, 63, 4, 1, 'nav');
add('Home', 'Home', null, 3, 67, 4, 1, 'nav');
add('PageUp', 'PgUp', null, 3, 71, 4, 1, 'nav');
add('Delete', 'Del', null, 4, 63, 4, 1, 'nav');
add('End', 'End', null, 4, 67, 4, 1, 'nav');
add('PageDown', 'PgDn', null, 4, 71, 4, 1, 'nav');
add('ArrowUp', '▲', null, 6, 67, 4, 1, 'nav');
add('ArrowLeft', '◀', null, 7, 63, 4, 1, 'nav');
add('ArrowDown', '▼', null, 7, 67, 4, 1, 'nav');
add('ArrowRight', '▶', null, 7, 71, 4, 1, 'nav');

/* Numeric keypad */
add('NumLock', 'Num', null, 3, 77, 4, 1, 'pad');
add('NumpadDivide', '/', null, 3, 81, 4, 1, 'pad');
add('NumpadMultiply', '*', null, 3, 85, 4, 1, 'pad');
add('NumpadSubtract', '-', null, 3, 89, 4, 1, 'pad');
add('Numpad7', '7', null, 4, 77, 4, 1, 'pad');
add('Numpad8', '8', null, 4, 81, 4, 1, 'pad');
add('Numpad9', '9', null, 4, 85, 4, 1, 'pad');
add('NumpadAdd', '+', null, 4, 89, 4, 2, 'pad');
add('Numpad4', '4', null, 5, 77, 4, 1, 'pad');
add('Numpad5', '5', null, 5, 81, 4, 1, 'pad');
add('Numpad6', '6', null, 5, 85, 4, 1, 'pad');
add('Numpad1', '1', null, 6, 77, 4, 1, 'pad');
add('Numpad2', '2', null, 6, 81, 4, 1, 'pad');
add('Numpad3', '3', null, 6, 85, 4, 1, 'pad');
add('NumpadEnter', 'Enter', null, 6, 89, 4, 2, 'pad');
add('Numpad0', '0', null, 7, 77, 8, 1, 'pad');
add('NumpadDecimal', '.', null, 7, 85, 4, 1, 'pad');

var BY_CODE = {};
KEYS.forEach(function (k) { BY_CODE[k.code] = k; });

/* ── Fingers (touch-typing convention) ────────────────────────────────── */
var FINGER_CODES = {
  'l-pinky': 'Backquote Digit1 Tab KeyQ CapsLock KeyA ShiftLeft KeyZ ControlLeft',
  'l-ring': 'Digit2 KeyW KeyS KeyX',
  'l-middle': 'Digit3 KeyE KeyD KeyC',
  'l-index': 'Digit4 Digit5 KeyR KeyT KeyF KeyG KeyV KeyB',
  'r-index': 'Digit6 Digit7 KeyY KeyU KeyH KeyJ KeyN KeyM',
  'r-middle': 'Digit8 KeyI KeyK Comma',
  'r-ring': 'Digit9 KeyO KeyL Period',
  'r-pinky': 'Digit0 Minus Equal Backspace KeyP BracketLeft BracketRight Backslash Semicolon Quote Enter Slash ShiftRight ControlRight',
  'thumb': 'Space',
};
var FINGER_OF = {};
Object.keys(FINGER_CODES).forEach(function (f) {
  FINGER_CODES[f].split(' ').forEach(function (c) { FINGER_OF[c] = f; });
});
var HOME_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];

/* ── Character -> key (+ Shift) map for printable ASCII ───────────────── */
var CHAR_MAP = {};
KEYS.forEach(function (k) {
  if (k.group !== 'main') return;
  if (k.code === 'Space') { CHAR_MAP[' '] = { code: 'Space', shift: false }; return; }
  if (/^Key[A-Z]$/.test(k.code)) {
    CHAR_MAP[k.label] = { code: k.code, shift: false };
    CHAR_MAP[k.label.toUpperCase()] = { code: k.code, shift: true };
  } else if (k.shift) {
    CHAR_MAP[k.label] = { code: k.code, shift: false };
    CHAR_MAP[k.shift] = { code: k.code, shift: true };
  }
});

function isLeftHandCode(code) { return /^l-/.test(FINGER_OF[code] || ''); }

/** Everything needed to guide the user to type `char` (the sentence itself is
 *  built by the interface so that it can be translated). */
function charInfo(char) {
  var m = CHAR_MAP[char];
  if (!m) return null;
  var finger = FINGER_OF[m.code];
  var info = { code: m.code, shift: m.shift, finger: finger, shiftCode: null, space: m.code === 'Space' };
  if (m.shift) info.shiftCode = isLeftHandCode(m.code) ? 'ShiftRight' : 'ShiftLeft';
  return info;
}


var MODIFIERS = { ShiftLeft: 1, ShiftRight: 1, ControlLeft: 1, ControlRight: 1, AltLeft: 1, AltRight: 1, MetaLeft: 1, MetaRight: 1, CapsLock: 1, NumLock: 1 };
function isModifier(code) { return !!MODIFIERS[code]; }

export { KEYS, BY_CODE, CHAR_MAP, FINGER_OF, HOME_CODES, MODIFIERS, charInfo, isModifier };
