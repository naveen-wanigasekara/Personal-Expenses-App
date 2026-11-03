// Explicit refresh checks the network and activates an installing update
// before reloading, instead of immediately reopening a cached app shell.
export async function activateAppUpdate(registration, timeoutMs = 8000) {
  if (!registration) return;
  await registration.update();
  const worker = registration.installing || registration.waiting;
  if (!worker || worker.state === 'activated' || worker.state === 'redundant') return;
  await new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      worker.removeEventListener('statechange', changed);
      resolve();
    };
    const changed = () => {
      if (worker.state === 'installed') worker.postMessage({type:'SKIP_WAITING'});
      else if (worker.state === 'activated' || worker.state === 'redundant') finish();
    };
    worker.addEventListener('statechange', changed);
    timer = setTimeout(finish, timeoutMs);
    changed();
  });
}
