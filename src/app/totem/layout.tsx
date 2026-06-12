import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xico Praia — Autoatendimento",
  // Impede zoom em dispositivos touch (kiosk)
  other: {
    "viewport": "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  },
};

export default function TotemLayout({ children }: { children: React.ReactNode }) {
  return (
    // touch-action: manipulation desativa double-tap zoom e reduz latência de toque
    // virtual-keyboard: manual bloqueia o teclado virtual do SO em navegadores modernos
    <div style={{ touchAction: "manipulation" }}>
      {children}
    </div>
  );
}
