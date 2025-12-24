import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NotificationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setIsEnabled(localStorage.getItem("notifications_enabled") === "true");
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Votre navigateur ne supporte pas les notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        localStorage.setItem("notifications_enabled", "true");
        setIsEnabled(true);
        toast.success("Notifications activées !");
        return true;
      } else if (result === "denied") {
        toast.error("Notifications refusées");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const disableNotifications = () => {
    localStorage.setItem("notifications_enabled", "false");
    setIsEnabled(false);
    toast.success("Notifications désactivées");
  };

  const showNotification = (message: NotificationMessage) => {
    // Always show toast notification
    toast.info(`${message.sender_name || "Nouveau message"}`, {
      description: message.content.substring(0, 100) + (message.content.length > 100 ? "..." : ""),
      duration: 5000,
    });

    // Show browser notification if enabled and permitted
    if (isEnabled && permission === "granted" && "Notification" in window) {
      try {
        const notification = new Notification(message.sender_name || "Nouveau message", {
          body: message.content.substring(0, 100),
          icon: message.sender_avatar || "/logo.svg",
          badge: "/logo.svg",
          tag: message.conversation_id,
          requireInteraction: false,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          // Navigate to conversation
          window.location.href = `/messagerie/${message.sender_id}`;
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel("new_messages_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=neq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Check if message is in a conversation where current user is participant
          const { data: conversation } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", newMessage.conversation_id)
            .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
            .single();

          if (!conversation) return;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, email")
            .eq("user_id", newMessage.sender_id)
            .single();

          const notificationData: NotificationMessage = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_name: senderProfile?.full_name || senderProfile?.email || "Utilisateur",
            sender_avatar: senderProfile?.avatar_url,
          };

          showNotification(notificationData);

          // Play notification sound
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0Maqzm8K1mHQU8n9/z2oQvBh1ryO7mnlINC16w5u6gVhYKQ6Th8bllHgU/muDz04g0Bx5owu7mnVMOC1yt5O+nWhkKQJvd8rpkIwU0itLy1YU0Bh5qwO7om1QOC1ap5O+lWBsKP5rd8rVhJAU3i9Ly14YyBx1pwO7mnFMOClevpO+lVxsKPZXb8rJiJAU6jNPx2YYyBh5owO7nn1QOClyn5/ClWRwKPJPb8bNiJAU8jtTx2oYyBh1pwO7mnlUOCl2o5PCkWh0KOpPa8bJjJAU+kNTx24YyBh1owO7mnlUOCl+p5/CiWx0KOZHa8bJjIwU/ktXx3IYxBh1nv+7mnlYOCV6q5/CiWRwKOJHZ8LJjIgVBk9Xx3oYwBh1mv+3mnlYOCVyq5/CjWRsKN5DY8LJjIgVDlNTw3oUwBh1lvu3mnlcOCF2r5/CjWBoKNpDY8LJiIQVElNTw34UwBh1ku+3mnlcPCF+s5++iWRoKNY/Y8LJhIQVGldPw4IQvBh1ku+3mnlcPCGCs5++iWBkKNI/X8LJhIAVHldPv4IMvBh5ku+3mnlgPCGGt5++hVxgKM4/X8LJgIAVIldPv4IIvBiBlu+3mnlgQB2Gu5++gVhgKMo7W8LJgHwVJltPv34IuBiBku+3mnlkQB2Kv5++gVRcKMY7W8LJfHgVKltPv3oEuBiBjuuzlnVkRB2Ow5e+fVBYKL43V8LJeHQVLl9Pv3YEuBh9iuuzknFoRB2Sx5e+eUxUKLo3V8LJdHQVMl9Lv3IAuBh9huuzkmloSB2Wy5O+eUhQKLYzU8LJcHAVNl9Lv24AuBh9huOzkmlsRB2az5O+dURQKLIzU8LJbHAVOl9Lv2n8uBx9gtOzkmVsSB2a05O+dUBMKK4vT8LJaGwVPmNLv2X8tBx9gsOzkmVwSB2a15O+cTxMKKovT8LJZGgVRmNLv138tBx9gru3kmVwSB2a25O+cThIKKYrS8LNYGgVSmNHv1n4tBx9bre3km10SB2e25O+bThEKKInS8LNXGQVTmNHv1X4tBx9arO3km14SB2e35O+bTRAKJ4nS8LNWGQVUmNHv0n8tBx9ZrO3km18SB2e45O+aTRAKJojR8LRVGQVVmNDv0X8tBx5YrO3km2ASB2e55e+ZSw8KJYfR8LRUGAVWmNDvz34tBx5Xq+3km2ESB2e65e+YSw4KJIfR8LRTGAVXmc/vz38tBx5Wqu3km2ESB2e75e+XSQ4KJIbR8LRSFwVYmc/vzn8tBx5Vqu3km2MSB2e85e+XSA0KI4bQ8LRSFgVZms/vzn0tBx5Vqe3km2QSB2e95u+WSA0KIobQ8LRSFQVams/vzH4tBx5Uqe3km2USB2e+5u+WSA0KIYbP8LVRFAVbms/vy30tBx5Uqe3knGUSB2e/5u+VRwwKIIXP8LVQFQVdms7vy34sBx5Uqe3knGYSB2fA5u+URwwKH4XO8LVQFQ==");
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch (error) {
            // Ignore audio errors
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEnabled, permission]);

  return {
    permission,
    isEnabled,
    requestPermission,
    disableNotifications,
  };
};
