"use client";

import { useEffect } from "react";

export function WorkerManifest({ token }: { token: string }) {
  useEffect(() => {
    let link = document.querySelector('link[rel="manifest"][data-worker]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "manifest");
      link.setAttribute("data-worker", "true");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `/api/worker/manifest?token=${encodeURIComponent(token)}`);
    return () => {
      link?.remove();
    };
  }, [token]);
  return null;
}
