export default function InstallHelp({isStandalone = false, canInstall = false, install}) {
  if (isStandalone) return null;
  return <details className="card install-help"><summary>Install Ledger on your phone</summary>
    {canInstall && <button className="save-btn" onClick={install}>Install Ledger</button>}
    <p>iPhone or iPad: open Ledger in Safari, tap Share, then Add to Home Screen.</p>
    <p>Android: open the browser menu and choose Install app or Add to Home screen.</p>
    <p>Installation is optional. Your financial records still need an internet connection.</p>
  </details>;
}
