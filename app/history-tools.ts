import {SafetyError} from './safety';
export function historyCursor(value:unknown){if(value===undefined||value===null||value==='')return 0;if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new SafetyError('Invalid message history cursor.',400);return value;}
