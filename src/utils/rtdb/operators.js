import { get, ref } from "firebase/database";
import { rtdb } from "../../firebase.js";
import { operatorPath } from "./paths.js";

/** True when `/ops/operators/{uid}` is set (console bootstrap). */
export async function isOperator(uid) {
  if (!uid) return false;
  try {
    const snap = await get(ref(rtdb, operatorPath(uid)));
    return snap.exists() && snap.val() === true;
  } catch {
    return false;
  }
}
