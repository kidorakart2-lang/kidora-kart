/**
 * Razorpay type declaration for the global `window.Razorpay` object.
 * The Razorpay checkout script is loaded dynamically at runtime.
 */
interface RazorpayCheckout {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayCheckout;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export {};
