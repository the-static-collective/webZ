// Static webZ gate: GrO pocket doors are encounters, never executable GrO actions.
// Existing src/field.js needs a receipt import for actions; do not provide one.
export function makeReceipt() { throw Error('WEBZ_DOOR_ACTIONS_NOT_AUTHORIZED'); }
