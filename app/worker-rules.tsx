/**
 * Displays worker-circle participation and privacy boundaries alongside circle-specific rules.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
export function WorkerRules({rules}:{rules?:string}) {
  return <section className="worker-rules"><h3>Peer support · membership rules</h3>
    <ul><li>Listen respectfully; ask before offering advice. No harassment, threats, recruitment pressure, or retaliation.</li><li>Do not post identifying workplace details, other people’s personal information, private messages, or confidential documents.</li><li>Distinguish personal experience from professional advice. Hosts are peer moderators, not verified advisers or union representatives.</li><li>Do not copy or share other members’ disclosures without permission. This rule cannot prevent screenshots or guarantee confidentiality.</li></ul>
    {rules&&<><strong>This circle’s purpose and admission rules</strong><p>{rules}</p></>}
    <p>Either host reviews admission and may remove participants. Report abuse through the app. Review has no guaranteed response time. Membership does not authorize anyone to represent you.</p>
  </section>;
}

