export type VoiceRecorderState='idle'|'requesting'|'recording'|'finishing'|'preview'|'sending';
export type VoiceFocusTarget='start'|'cancel'|'stop'|'status'|null;

export function voiceFocusTarget(state:VoiceRecorderState,keyboardStarted:boolean):VoiceFocusTarget{
 if(!keyboardStarted)return null;
 if(state==='requesting')return 'cancel';
 if(state==='recording')return 'stop';
 if(state==='finishing'||state==='preview'||state==='sending')return 'status';
 return 'start';
}
