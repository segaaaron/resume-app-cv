"use client"

import Script from "next/script"

interface ClarityScriptProps {
  projectId: string
}

/**
 * Microsoft Clarity heatmaps & session recordings (privacy-first, free).
 * Loads via next/script with `afterInteractive` strategy so it never blocks
 * Core Web Vitals (LCP/FID/INP). Only mounts when a project ID is supplied.
 */
export default function ClarityScript({ projectId }: ClarityScriptProps) {
  if (!projectId || !/^[a-z0-9]+$/i.test(projectId)) return null

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
    >
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(projectId)});`}
    </Script>
  )
}
