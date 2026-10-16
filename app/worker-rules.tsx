export function WorkerRules({rules}:{rules?:string}) {
  return <section className="worker-rules"><h3>Peer support · membership rules</h3>
    <ul><li>Listen respectfully; ask before offering advice. No harassment, threats, recruitment pressure, or retaliation.</li><li>Do not post identifying workplace details, other people’s personal information, private messages, or confidential documents.</li><li>Distinguish personal experience from professional advice. Hosts are peer moderators, not verified advisers or union representatives.</li><li>Do not copy or share other members’ disclosures without permission. This rule cannot prevent screenshots or guarantee confidentiality.</li></ul>
    {rules&&<><strong>This circle’s purpose and admission rules</strong><p>{rules}</p></>}
    <p>Hosts manage participation and may remove participants. Listed circles use join requests; unlisted organizing circles use private invitations. Report abuse through the app. Review has no guaranteed response time. Membership does not authorize anyone to represent you.</p>
  </section>;
}

