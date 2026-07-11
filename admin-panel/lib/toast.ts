import { toast as shadcnToast } from "@/hooks/use-toast";

export const toast = {
  error(message: string) {
    shadcnToast({
      title: message,
      variant: "destructive",
    });
  },
  success(message: string) {
    shadcnToast({
      title: message,
    });
  },
  info(message: string) {
    shadcnToast({
      title: message,
    });
  },
};
