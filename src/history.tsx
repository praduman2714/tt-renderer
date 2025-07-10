// src/history.ts

import { createBrowserHistory } from "history";

export const getHistory = () => {
  if (typeof window !== "undefined") {
    return createBrowserHistory();
  }
  return null;
};
