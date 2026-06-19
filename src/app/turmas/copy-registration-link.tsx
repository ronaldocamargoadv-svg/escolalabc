"use client";

import { useState } from "react";

type CopyRegistrationLinkProps = {
  url: string;
};

export function CopyRegistrationLink({ url }: CopyRegistrationLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "true");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      document.body.removeChild(field);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <button className="text-button" type="button" onClick={copyLink}>
      {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}
