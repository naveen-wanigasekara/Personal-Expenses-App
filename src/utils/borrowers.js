// Profiles are encrypted money_records, just like loans. Existing loan rows are
// never rewritten to infer identity: exact legacy names are provisional groups.
export const cleanBorrowerName = value => String(value || '').trim().replace(/\s+/g, ' ');
const nameKey = value => cleanBorrowerName(value).toLocaleLowerCase();
const legacyKey = name => `legacy:${encodeURIComponent(String(name || '').trim())}`;

export function borrowerGroups(records) {
  const profiles = new Map(records.filter(r => r.kind === 'borrower').map(r => [r.id, r]));
  const root = id => {
    const seen = new Set();
    while (profiles.has(id) && !seen.has(id)) {
      seen.add(id);
      const profile = profiles.get(id);
      if (!profile.mergedInto) return profile;
      id = profile.mergedInto;
    }
    return null;
  };
  const groups = new Map();
  for (const profile of profiles.values()) {
    const canonical = root(profile.id);
    if (canonical && !groups.has(canonical.id)) groups.set(canonical.id, { id: canonical.id, name: canonical.name, note: canonical.note || '', profile: canonical, loans: [] });
  }
  for (const loan of records.filter(r => r.kind === 'loan')) {
    let canonical = loan.borrowerId ? root(loan.borrowerId) : null;
    const legacyName = String(loan.borrower || '').trim();
    if (!canonical && !loan.borrowerId) {
      const matches = new Map();
      for (const profile of profiles.values()) {
        if ((profile.legacyNames || []).includes(legacyName)) {
          const candidate = root(profile.id);
          if (candidate) matches.set(candidate.id, candidate);
        }
      }
      if (matches.size === 1) canonical = [...matches.values()][0];
    }
    const id = canonical?.id || legacyKey(legacyName);
    if (!groups.has(id)) groups.set(id, { id, name: legacyName || 'Unnamed borrower', note: '', legacyName, profile: null, loans: [] });
    groups.get(id).loans.push(loan);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

function checkName(name) {
  if (!name || name.length > 120) throw new Error('Enter a borrower name within 120 characters.');
}
const put = (records, profile) => records.some(r => r.id === profile.id) ? records.map(r => r.id === profile.id ? profile : r) : [...records, profile];

export function saveBorrowerProfile(records, draft, createId) {
  const name = cleanBorrowerName(draft.name);
  checkName(name);
  const groups = borrowerGroups(records);
  const current = draft.id ? groups.find(g => g.id === draft.id) : null;
  if (draft.id && !current) throw new Error('Borrower not found. Refresh your records.');
  if (groups.some(g => g.id !== current?.id && nameKey(g.name) === nameKey(name))) throw new Error('A borrower with this name already exists. Select that borrower or use a distinct name.');
  if ((draft.note || '').length > 1000) throw new Error('Keep borrower notes within 1,000 characters.');
  const profile = { ...(current?.profile || {}), id: current?.profile?.id || createId(), kind: 'borrower', name,
    note: (draft.note || '').trim(), legacyNames: current?.profile?.legacyNames || (current ? [current.legacyName] : []) };
  return { records: put(records, profile), profile };
}

export function bindLoanBorrower(records, draft, createId) {
  if (draft.borrowerId) {
    const group = borrowerGroups(records).find(g => g.id === draft.borrowerId);
    if (!group) throw new Error('Select an existing borrower.');
    if (group.profile) return { records, borrowerId: group.id, borrower: group.name };
    const saved = saveBorrowerProfile(records, { id: group.id, name: group.name, note: group.note }, createId);
    return { records: saved.records, borrowerId: saved.profile.id, borrower: saved.profile.name };
  }
  const saved = saveBorrowerProfile(records, { name: draft.borrower, note: '' }, createId);
  return { records: saved.records, borrowerId: saved.profile.id, borrower: saved.profile.name };
}

export function mergeBorrowerProfiles(records, sourceId, targetId, createId) {
  const groups = borrowerGroups(records);
  const source = groups.find(g => g.id === sourceId), target = groups.find(g => g.id === targetId);
  if (!source || !target || source.id === target.id) throw new Error('Choose two different borrowers.');
  let targetProfile = target.profile || { id: createId(), kind: 'borrower', name: target.name, note: target.note || '', legacyNames: [target.legacyName] };
  targetProfile = { ...targetProfile, legacyNames: [...new Set([...(targetProfile.legacyNames || []), ...(source.profile?.legacyNames || [source.legacyName])].filter(Boolean))] };
  let next = put(records, targetProfile);
  if (source.profile) next = put(next, { ...source.profile, mergedInto: targetProfile.id });
  return { records: next, targetId: targetProfile.id };
}

export function validateBorrowerProfiles(records) {
  const profiles = new Map(records.filter(r => r.kind === 'borrower').map(r => [r.id, r]));
  for (const profile of profiles.values()) {
    checkName(cleanBorrowerName(profile.name));
    if ((profile.note || '').length > 1000 || !Array.isArray(profile.legacyNames || []) || (profile.legacyNames || []).some(n => typeof n !== 'string' || n.length > 120)) throw new Error('Invalid borrower details.');
    const seen = new Set([profile.id]);
    let target = profile.mergedInto;
    while (target) {
      if (seen.has(target) || !profiles.has(target)) throw new Error('Invalid borrower merge.');
      seen.add(target); target = profiles.get(target).mergedInto;
    }
  }
  for (const loan of records.filter(r => r.kind === 'loan')) if (loan.borrowerId && !profiles.has(loan.borrowerId)) throw new Error('This loan needs a valid borrower.');
  const names = new Set();
  for (const group of borrowerGroups(records).filter(g => g.profile)) {
    const key = nameKey(group.name);
    if (names.has(key)) throw new Error('Duplicate borrower names. Merge the duplicate profiles.');
    names.add(key);
  }
}

export function borrowerLoanLabel(loan, loans) {
  const ordered = [...loans].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return `Loan ${ordered.findIndex(l => l.id === loan.id) + 1} · ${loan.date} · ${Number(loan.amount).toLocaleString()}`;
}
