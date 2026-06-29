"use client";

import { useEffect } from "react";

export default function AxeAccessibility() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@axe-core/react").then((axe) => {
        const React = require("react");
        const ReactDOM = require("react-dom");
        axe.default(React, ReactDOM, 1000);
      });
    }
  }, []);

  return null;
}
