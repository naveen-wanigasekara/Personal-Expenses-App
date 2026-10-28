import { useEffect, useId, useRef, useState } from "react";
import { Bell, Building2, Check, Copy, Edit2, Menu, Plus, RefreshCw, Trash2 } from "lucide-react";
import Sheet from "./Sheet.jsx";
import { bankDetailsStore } from "../lib/bankDetails.js";
import { copyBankDetails, formatBankDetails, normalizeBankDetails, validBankDetails } from "../utils/bankDetails.js";

const FIELDS = [
  ["bank", "Bank", "e.g. Commercial Bank"],
  ["branch", "Branch", "e.g. Colombo"],
  ["accountName", "Account holder name", "Name on the account"],
  ["accountNumber", "Account number", "Your account number"],
];

function BankDetailsForm({ account, onClose, onSave, saving, error }) {
  const id = useId();
  const [details, setDetails] = useState(() => normalizeBankDetails(account));
  return (
    <Sheet title={account ? "Edit bank details" : "Add bank details"} onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); if (validBankDetails(details) && !saving) onSave(details); }}>
        {FIELDS.map(([key, label, placeholder], index) => (
          <div key={key}>
            <label className="field-lbl" htmlFor={`${id}-${key}`}>{label}</label>
            <input id={`${id}-${key}`} className="text-input" type="text" value={details[key]} placeholder={placeholder}
              onChange={(event) => setDetails((previous) => ({ ...previous, [key]: event.target.value }))}
              maxLength={key === "accountNumber" ? 80 : 120} required autoFocus={index === 0} disabled={saving} autoComplete="off" />
          </div>
        ))}
        {error && <p className="bank-error" role="alert">{error}</p>}
        <button className="save-btn" type="submit" disabled={saving || !validBankDetails(details)}>{saving ? "Saving…" : "Save bank details"}</button>
      </form>
    </Sheet>
  );
}

export default function BankDetailsView({ userId, onOpenMenu, onOpenNotifications, notifCount, showQuickRefresh, onQuickRefresh }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [manualCopyId, setManualCopyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const copyTimer = useRef(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setLoadError(false);
    setAccounts([]);
    setForm(null);
    setSaveError("");
    setActionError("");
    setCopiedId(null);
    setManualCopyId(null);
    clearTimeout(copyTimer.current);
    bankDetailsStore.load(userId).then((saved) => {
      if (current) setAccounts(saved);
    }).catch(() => {
      if (current) setLoadError(true);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [userId, reload]);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const closeForm = () => { if (!saving) setForm(null); };
  const openForm = (account = "new") => { setSaveError(""); setForm(account); };
  const save = async (details) => {
    setSaving(true);
    setSaveError("");
    const account = { id: form === "new" ? crypto.randomUUID() : form.id, ...normalizeBankDetails(details) };
    const next = form === "new" ? [...accounts, account] : accounts.map((existing) => existing.id === account.id ? account : existing);
    try {
      const saved = await bankDetailsStore.save(userId, next);
      setAccounts(saved);
      setForm(null);
      setCopiedId(null);
      setManualCopyId(null);
    } catch { setSaveError("Couldn't save bank details. Please try again."); }
    finally { setSaving(false); }
  };
  const remove = async (account) => {
    if (saving || !window.confirm(`Delete the saved bank details for ${account.bank}?`)) return;
    setSaving(true);
    setActionError("");
    try {
      const saved = await bankDetailsStore.save(userId, accounts.filter((existing) => existing.id !== account.id));
      setAccounts(saved);
      setCopiedId(null);
      setManualCopyId(null);
    } catch { setActionError("Couldn't delete bank details. Please try again."); }
    finally { setSaving(false); }
  };
  const copy = async (account) => {
    clearTimeout(copyTimer.current);
    setCopiedId(null);
    setManualCopyId(null);
    try {
      await copyBankDetails(account, navigator.clipboard);
      setCopiedId(account.id);
      copyTimer.current = setTimeout(() => setCopiedId(null), 2500);
    } catch { setManualCopyId(account.id); }
  };

  return (
    <div className="view view-bank-details">
      <div className="dash-topbar">
        <div className="mheader-left"><button className="icon-btn" onClick={onOpenMenu} aria-label="Menu"><Menu size={16} /></button></div>
        <div className="mheader-center"><span className="mheader-title">Bank Details</span></div>
        <div className="mheader-right">
          {showQuickRefresh && <button className="bell-btn" onClick={onQuickRefresh} aria-label="Refresh"><RefreshCw size={16} /></button>}
          <button className="bell-btn" onClick={onOpenNotifications} aria-label="Notifications"><Bell size={16} />{notifCount > 0 && <span className="notif-badge">{notifCount}</span>}</button>
        </div>
      </div>
      <div className="bank-details-scroll">
        <div className="page-hd"><h1 className="page-title">Bank Details</h1><p className="bank-intro">Save your account details and copy them whenever you need.</p></div>
        {loading ? <p className="bank-status" role="status">Loading bank details…</p> : loadError ? (
          <div className="card"><p className="bank-error" role="alert">Bank details are temporarily unavailable. Please try again.</p><button className="save-btn" onClick={() => setReload((value) => value + 1)}>Try again</button></div>
        ) : <>
          <button className="save-btn bank-add" onClick={() => openForm()} disabled={saving}><Plus size={17} /> Add bank details</button>
          {actionError && <p className="bank-error" role="alert">{actionError}</p>}
          {accounts.length === 0 ? <div className="card bank-empty"><Building2 size={28} aria-hidden="true" /><p>No bank details saved yet.</p></div> : (
            <div className="bank-accounts">
              {accounts.map((account) => (
                <article className="card bank-account" key={account.id} aria-label={`${account.bank} account`}>
                  <div className="bank-account-heading"><Building2 size={20} aria-hidden="true" /><h2>{account.bank}</h2></div>
                  <dl className="bank-account-fields"><div><dt>Branch</dt><dd>{account.branch}</dd></div><div><dt>Account holder</dt><dd>{account.accountName}</dd></div><div><dt>Account number</dt><dd className="bank-account-number">{account.accountNumber}</dd></div></dl>
                  <button className="save-btn" onClick={() => copy(account)} disabled={saving}>{copiedId === account.id ? <Check size={16} /> : <Copy size={16} />}{copiedId === account.id ? "Copied!" : "Copy bank details"}</button>
                  <span className="bank-sr-only" role="status">{copiedId === account.id ? "Bank details copied to clipboard." : ""}</span>
                  {manualCopyId === account.id && <div className="bank-manual-copy"><p role="status">Select and copy the details below.</p><textarea readOnly aria-label={`Copy details for ${account.bank}`} value={formatBankDetails(account)} onFocus={(event) => event.target.select()} /></div>}
                  <div className="bank-account-actions"><button className="tx-edit" onClick={() => openForm(account)} disabled={saving}><Edit2 size={14} /> Edit</button><button className="tx-del" onClick={() => remove(account)} disabled={saving}><Trash2 size={14} /> Delete</button></div>
                </article>
              ))}
            </div>
          )}
        </>}
      </div>
      {form && <BankDetailsForm account={form === "new" ? null : form} onClose={closeForm} onSave={save} saving={saving} error={saveError} />}
    </div>
  );
}
