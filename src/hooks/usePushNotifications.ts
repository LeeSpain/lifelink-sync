import { useCallback, useEffect, useRef, useState } from "react";
import { PushNotifications, PermissionStatus } from "@capacitor/push-notifications";
import type { PluginListenerHandle } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<PermissionStatus["receive"] | "unknown">("unknown");
  const [isRegistered, setIsRegistered] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let regListener: PluginListenerHandle | undefined;
    let regErrorListener: PluginListenerHandle | undefined;
    let receivedListener: PluginListenerHandle | undefined;

    const setup = async () => {
      try {
        const perm = await PushNotifications.checkPermissions();
        setPermission(perm.receive);
      } catch (e) {
        // probably running on web without native support
        setPermission("denied");
      }

      try {
        regListener = await PushNotifications.addListener("registration", (token) => {
          tokenRef.current = token.value;
          setIsRegistered(true);
          toast({ title: "Push enabled", description: "Notifications are active." });
          console.log("Push token", token.value);
        });

        regErrorListener = await PushNotifications.addListener("registrationError", (err) => {
          setIsRegistered(false);
          toast({ title: "Push registration failed", description: String(err), variant: "destructive" });
        });

        receivedListener = await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          toast({ title: notification.title ?? "Notification", description: notification.body ?? "" });
        });
      } catch (e) {
        // listeners likely unsupported on web
      }
    };

    setup();

    return () => {
      regListener?.remove();
      regErrorListener?.remove();
      receivedListener?.remove();
    };
  }, [toast]);

  const requestPermissionAndRegister = useCallback(async () => {
    try {
      const current = await PushNotifications.checkPermissions();
      if (current.receive !== "granted") {
        const req = await PushNotifications.requestPermissions();
        setPermission(req.receive);
        if (req.receive !== "granted") return false;
      }
      await PushNotifications.register();
      return true;
    } catch (e) {
      toast({ title: "Push not supported here", description: "Use the mobile app to enable push notifications.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const unregister = useCallback(async () => {
    try {
      await PushNotifications.removeAllListeners();
      setIsRegistered(false);
      tokenRef.current = null;
      toast({ title: "Push disabled", description: "You will no longer receive notifications." });
    } catch (e) {
      // ignore
    }
  }, [toast]);

  return { permission, isRegistered, requestPermissionAndRegister, unregister };
};
