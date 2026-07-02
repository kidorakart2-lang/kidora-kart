"use client";

import { useEffect, useId } from "react";
import { getThemeColor } from "@/lib/utils";

export default function ThemeColorMeta() {
  const id = useId();

  useEffect(() => {
    const color = getThemeColor();
    let meta = document.querySelector<HTMLMetaElement>(
      `meta[name="theme-color"]`
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;

    let msMeta = document.querySelector<HTMLMetaElement>(
      `meta[name="msapplication-TileColor"]`
    );
    if (!msMeta) {
      msMeta = document.createElement("meta");
      msMeta.name = "msapplication-TileColor";
      document.head.appendChild(msMeta);
    }
    msMeta.content = color;
  }, [id]);

  return null;
}
