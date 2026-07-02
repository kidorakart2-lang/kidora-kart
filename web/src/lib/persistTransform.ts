import { createTransform } from "redux-persist";
import { PERSIST_KEY } from "./persistEncrypt";

function xor(str: string): string {
  if (!PERSIST_KEY) return str;
  let r = "";
  for (let i = 0; i < str.length; i++) {
    r += String.fromCharCode(
      str.charCodeAt(i) ^ PERSIST_KEY.charCodeAt(i % PERSIST_KEY.length)
    );
  }
  return r;
}

const encryptTransform = PERSIST_KEY
  ? createTransform(
      (s: unknown) => {
        try {
          return btoa(encodeURIComponent(xor(JSON.stringify(s))));
        } catch {
          return s as object;
        }
      },
      (s: unknown) => {
        try {
          return JSON.parse(
            xor(decodeURIComponent(atob(s as string)))
          ) as object;
        } catch {
          return s as object;
        }
      },
      { whitelist: ["cart", "wishlist", "auth"] }
    )
  : undefined;

export default encryptTransform;
