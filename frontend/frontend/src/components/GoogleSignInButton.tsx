import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return;

    const renderButton = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => onCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline", size: "large", width: 320, text: "continue_with",
      });
    };

    if (window.google) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderButton;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" disabled className="btn-secondary w-full opacity-50 cursor-not-allowed" title="Google Sign-In isn't configured (VITE_GOOGLE_CLIENT_ID unset)">
        Continue with Google (not configured)
      </button>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
