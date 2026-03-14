import {
  BoxRenderable,
  TextRenderable,
  createTextAttributes,
} from "@opentui/core";
import type { RenderContext, CliRenderer } from "@opentui/core";
import { COLORS } from "../colors.js";

export type NotificationType = "info" | "success" | "error" | "warning";

export interface NotificationOptions {
  /** Notification message */
  message: string;
  /** Type determines color */
  type?: NotificationType;
  /** Auto-dismiss timeout in ms (default: 3000) */
  timeout?: number;
  /** Custom timeout handler */
  onDismiss?: () => void;
}

/**
 * NotificationsOverlay - Displays stacked toast notifications
 */
export class NotificationsOverlay extends BoxRenderable {
  private notifications: BoxRenderable[] = [];

  private NOTIFICATION_COLORS: Record<
    NotificationType,
    { fg: string; bg: string; icon: string }
  > = {
    info: { fg: COLORS.primary, bg: COLORS.background, icon: "ℹ" },
    success: { fg: COLORS.success, bg: COLORS.surface, icon: "✓" },
    error: { fg: COLORS.error, bg: COLORS.surface, icon: "✗" },
    warning: { fg: COLORS.warning, bg: COLORS.surface, icon: "⚠" },
  };

  constructor(
    public renderer: RenderContext,
    options?: { position?: "top" | "bottom" },
  ) {
    super(renderer, {
      width: "auto",
      maxWidth: "80%",
      height: "auto",
      flexDirection: "column",
      gap: 1,
      position: "absolute",
      right: 1,
      top: options?.position === "bottom" ? undefined : 1,
      bottom: options?.position === "bottom" ? 1 : undefined,
      zIndex: 9999,
    });
  }

  /**
   * Show a notification
   */
  show(options: NotificationOptions): void {
    const type = options.type || "info";
    const colors = this.NOTIFICATION_COLORS[type];
    const timeout = options.timeout ?? 3000;
    const ctx = (this as any)._ctx as RenderContext;

    // Compact notification
    const notification = new BoxRenderable(ctx, {
      width: "auto",
      height: "auto",
      backgroundColor: colors.bg,
      padding: 0,
      marginBottom: 0,
      flexDirection: "row",
      gap: 1,
      alignItems: "center",
    });

    // Styled icon
    const icon = new TextRenderable(ctx, {
      content: colors.icon,
      fg: colors.fg,
      attributes: createTextAttributes({ bold: true }),
    });

    // Message
    const message = new TextRenderable(ctx, {
      content: options.message,
      fg: colors.fg,
    });

    notification.add(icon);
    notification.add(message);
    super.add(notification);
    this.notifications.push(notification);

    // Request render
    this.renderer.requestRender?.();

    // Auto-dismiss
    if (timeout > 0) {
      setTimeout(() => {
        this.dismiss(notification);
        options.onDismiss?.();
      }, timeout);
    }
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(notification: BoxRenderable): void {
    const index = this.notifications.indexOf(notification);
    if (index !== -1) {
      this.remove(notification.id);
      this.notifications.splice(index, 1);
      this.renderer.requestRender?.();
    }
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    for (const n of this.notifications) {
      this.remove(n.id);
    }
    this.notifications = [];
    this.renderer.requestRender?.();
  }

  // Convenience methods
  info(message: string, timeout?: number): void {
    this.show({ message, type: "info", timeout });
  }
  success(message: string, timeout?: number): void {
    this.show({ message, type: "success", timeout });
  }
  error(message: string, timeout?: number): void {
    this.show({ message, type: "error", timeout });
  }
  warning(message: string, timeout?: number): void {
    this.show({ message, type: "warning", timeout });
  }
}
