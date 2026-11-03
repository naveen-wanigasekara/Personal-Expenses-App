import { supabase } from "./supabase.js";
import { encryptValue, decryptValue } from "./crypto.js";
import { createBankDetailsStore } from "../utils/bankDetails.js";

export const bankDetailsStore = createBankDetailsStore(supabase, { encryptValue, decryptValue });
