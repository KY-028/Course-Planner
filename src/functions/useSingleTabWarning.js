import { useEffect } from "react";

const TAB_CHANNEL = "course-selection-tab";

/**
 * Warn once on mount if another tab already has /course-selection open.
 */
export function useSingleTabWarning(pageKey = TAB_CHANNEL) {
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;

    const tabId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const channel = new BroadcastChannel(pageKey);
    let otherTabDetected = false;

    const onMessage = (event) => {
      const { type, tabId: senderId } = event.data || {};
      if (senderId === tabId) return;

      if (type === "ping") {
        otherTabDetected = true;
        channel.postMessage({ type: "pong", tabId });
      }
      if (type === "pong") {
        otherTabDetected = true;
      }
    };

    channel.addEventListener("message", onMessage);
    channel.postMessage({ type: "ping", tabId });

    const timer = window.setTimeout(() => {
      if (otherTabDetected) {
        window.alert(
          "Course Selection is open in another tab. Changes saved in one tab may overwrite the other."
        );
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, [pageKey]);
}
