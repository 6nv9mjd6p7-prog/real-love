import {ageFromBirthDate,type Profile} from './model';
type EditableDraft=Omit<Partial<Profile>,'age'>&{age?:number|string};
// Compare only editable profile values; photo/access metadata is managed separately.
export function profileDraftChanged(draft:Record<string,unknown>,saved:Record<string,unknown>|null,defaults:Record<string,unknown>,consent:boolean,savedConsent:boolean){
 if(!saved)return true;
 if(consent!==savedConsent)return true;
 return Object.keys(defaults).filter(key=>!['active','hasPhoto'].includes(key)).some(key=>{
  const clean=(p:Record<string,unknown>)=>{const value=p[key]??defaults[key];if(['age','minAge','maxAge'].includes(key))return Number(value);if(['name','city','region','country','about','firstStep'].includes(key)&&typeof value==='string')return value.trim();return value;};
  return JSON.stringify(clean(draft))!==JSON.stringify(clean(saved));
 });
}
export function profileDraftError(draft:EditableDraft,consent:boolean){
 if(!draft.name?.trim())return 'Add your chosen name in Basics.';
 if(draft.birthDate&&ageFromBirthDate(draft.birthDate)===null)return 'Enter a valid date of birth in Basics.';
 const age=draft.birthDate?ageFromBirthDate(draft.birthDate):Number(draft.age);
 if(age===null||!Number.isInteger(age)||age<18||age>99)return 'Enter a date of birth for an adult aged 18–99 in Basics.';
 if(!draft.city?.trim()||!draft.region?.trim()||!draft.country?.trim())return 'Choose your city or general area from the location suggestions in Basics.';
 if(!draft.interests?.length||draft.interests.length>8)return 'Choose 1–8 interests in Interests.';
 if(!draft.about?.trim())return 'Add a short introduction in Introduction & privacy.';
 if(!Number.isInteger(Number(draft.minAge))||!Number.isInteger(Number(draft.maxAge))||Number(draft.minAge)<18||Number(draft.maxAge)>99||Number(draft.minAge)>Number(draft.maxAge))return 'Choose an adult age range between 18 and 99, with the minimum no higher than the maximum.';
 if(!consent)return 'Read and agree to the app conduct rules in Introduction & privacy before saving.';
 return '';
}

export function profileSetupError(draft:EditableDraft,step:number){if(step===1){if(!draft.birthDate)return 'Enter your private date of birth.';if(ageFromBirthDate(draft.birthDate)===null)return 'Enter a valid date of birth.';if(!draft.name?.trim())return 'Add your chosen name.';const age=ageFromBirthDate(draft.birthDate);if(age===null||age<18||age>99)return 'Enter a date of birth for an adult aged 18–99.';if(!draft.city?.trim()||!draft.region?.trim()||!draft.country?.trim())return 'Choose your city or general area from the location suggestions.';}if(step===2&&(!draft.interests?.length||draft.interests.length>8))return 'Choose 1–8 interests before continuing.';return '';}

export function profileValidationIssue(draft:EditableDraft,consent:boolean){const message=profileDraftError(draft,consent);if(!message)return null;const field=!draft.name?.trim()?'name':draft.birthDate&&ageFromBirthDate(draft.birthDate)===null?'birthDate':(draft.birthDate?(ageFromBirthDate(draft.birthDate)??0)<18||(ageFromBirthDate(draft.birthDate)??100)>99:!Number.isInteger(Number(draft.age))||Number(draft.age)<18||Number(draft.age)>99)?'birthDate':!draft.city?.trim()||!draft.region?.trim()||!draft.country?.trim()?'city':!draft.interests?.length||draft.interests.length>8?'interests':!draft.about?.trim()?'about':!Number.isInteger(Number(draft.minAge))||!Number.isInteger(Number(draft.maxAge))||Number(draft.minAge)<18||Number(draft.maxAge)>99||Number(draft.minAge)>Number(draft.maxAge)?'minAge':'consent';return {message,field,step:['name','birthDate','city'].includes(field)?1:field==='interests'?2:field==='minAge'?4:3};}

// Resume at the first incomplete required step; optional answers never hold up signup.
export function profileResumeStep(draft:EditableDraft){
 if(profileSetupError(draft,1))return 1;
 if(profileSetupError(draft,2))return 2;
 return 3;
}
