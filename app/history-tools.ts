/**
 * Validates pagination cursors before they are used to retrieve older messages.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {SafetyError} from './safety';
export function historyCursor(value:unknown){if(value===undefined||value===null||value==='')return 0;if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new SafetyError('Invalid message history cursor.',400);return value;}
