import * as React from "react";
import { User } from "lucide-react";

import { cn } from "@/lib/utils";

const avatarSizes = {
  small: { avatar: "h-4 w-4 text-[8px]", notification: "h-1.5 min-w-1.5 text-[0px]", status: "h-[5px] w-[5px] border" },
  medium: { avatar: "h-6 w-6 text-[10px]", notification: "h-2.5 min-w-2.5 text-[7px]", status: "h-[7px] w-[7px] border" },
  large: { avatar: "h-10 w-10 text-sm", notification: "h-3.5 min-w-3.5 text-[9px]", status: "h-2.5 w-2.5 border-2" },
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  alt?: string;
  initials?: string;
  notificationCount?: number | string;
  showNotification?: boolean;
  showStatus?: boolean;
  size?: keyof typeof avatarSizes;
  src?: string;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ alt, className, initials = "AB", notificationCount = 2, showNotification = false, showStatus = false, size = "small", src, ...props }, ref) => {
    const sizes = avatarSizes[size];
    return (
      <span ref={ref} className={cn("relative inline-flex shrink-0", sizes.avatar, className)} {...props}>
        <span
          className={cn(
            "flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[var(--air-color-border-default)] font-semibold",
            src ? "bg-[var(--air-color-interaction-accent-subtle)] text-[var(--air-color-text-brand)]" : "bg-[var(--air-color-bg-brand)] text-[var(--air-color-text-inverse)]",
          )}
          role={src ? undefined : "img"}
          aria-label={src ? undefined : alt ?? initials}
        >
          {src ? <img className="h-full w-full object-cover" src={src} alt={alt ?? ""} /> : initials ? initials : <User aria-hidden="true" className="h-3/5 w-3/5" />}
        </span>
        {showStatus ? (
          <span
            role="img"
            aria-label="Online"
            className={cn("absolute bottom-0 right-0 rounded-full border-[var(--air-color-bg-canvas)] bg-[var(--air-color-icon-success)]", sizes.status)}
          />
        ) : null}
        {showNotification ? (
          <span
            role="img"
            aria-label={`${notificationCount} notifications`}
            className={cn("absolute right-0 top-0 flex -translate-y-0 translate-x-0 items-center justify-center rounded-full border border-[var(--air-color-bg-canvas)] bg-[var(--air-color-icon-error)] px-0.5 font-semibold leading-none text-white", sizes.notification)}
          >
            {size === "small" ? null : notificationCount}
          </span>
        ) : null}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
