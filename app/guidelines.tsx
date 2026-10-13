/**
 * Displays the canonical conduct rules from rules.ts so the agreement and settings surfaces use the same rules.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {communityRules,RULES_VERSION} from './rules';
export default function Guidelines(){return <section className="form-section guidelines"><h2>App conduct rules</h2><p>These rules govern use of Real Love. They apply to everyone, including founders and hosts. They govern conduct, not someone’s clothing, attractiveness, gender, culture, religion, or beliefs.</p>{communityRules.map(([title,body])=><details key={title}><summary>{title}</summary><p>{body}</p></details>)}<p className="field-help">Agreement version {RULES_VERSION}. Content review and filters reduce risk; they cannot guarantee a person’s intentions or safety.</p></section>;}
