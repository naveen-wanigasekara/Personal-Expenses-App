import { useState, useEffect } from "react";
import { supabase, initCrypto, clearCrypto } from "./lib/supabase.js";
import AuthScreen from "./components/AuthScreen.jsx";
import MainApp from "./components/MainApp.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptoReady, setCryptoReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        await initCrypto(session.user.id);
        setCryptoReady(true);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        await initCrypto(session.user.id);
        setCryptoReady(true);
      } else {
        clearCrypto();
        setCryptoReady(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading || (session && !cryptoReady)) {
    return <div className="loading"><div className="loading-ring" /></div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <MainApp user={session.user} />;
}
