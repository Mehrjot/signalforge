export function inr(n: number): string {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function inrFull(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export const CHANNEL_META: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  email: { label: "Email", color: "#7C6AF7" },
  sms: { label: "SMS", color: "#F5A524" },
  rcs: { label: "RCS", color: "#00E5A0" },
};

export const EVENT_META: Record<string, { label: string; color: string }> = {
  sent: { label: "Sent", color: "#6B6880" },
  delivered: { label: "Delivered", color: "#9C8FF9" },
  opened: { label: "Opened", color: "#7C6AF7" },
  read: { label: "Read", color: "#00E5A0" },
  clicked: { label: "Clicked", color: "#00E5A0" },
  failed: { label: "Failed", color: "#FF5C7C" },
  converted: { label: "Order placed", color: "#00E5A0" },
};
