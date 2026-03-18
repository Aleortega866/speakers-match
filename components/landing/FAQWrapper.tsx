"use client";

import dynamic from "next/dynamic";

const FAQ = dynamic(() => import("./FAQ"), { ssr: false });

export default function FAQWrapper() {
  return <FAQ />;
}
