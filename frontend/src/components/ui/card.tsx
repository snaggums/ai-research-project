import * as React from "react";

import { cn } from "@/lib/utils";

interface CardShellProps extends React.HTMLAttributes<HTMLElement> {
  disabled?: boolean;
}

const CardShell = React.forwardRef<HTMLElement, CardShellProps>(
  ({ children, className, disabled = false, ...props }, ref) => (
    <article
      ref={ref}
      aria-disabled={disabled || undefined}
      className={cn(
        "air-card overflow-hidden rounded-xl border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] text-[var(--air-color-text-primary)] transition-colors",
        !disabled && "hover:bg-[var(--air-color-bg-subtle)] active:bg-[var(--air-color-interaction-accent-subtle)]",
        disabled && "bg-[var(--air-color-bg-disabled)] text-[var(--air-color-text-disabled)]",
        className,
      )}
      {...props}
    >
      {children}
    </article>
  ),
);
CardShell.displayName = "CardShell";

export interface SimpleCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  action?: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  title: React.ReactNode;
}

const SimpleCard = React.forwardRef<HTMLElement, SimpleCardProps>(
  ({ action, className, description, disabled = false, title, ...props }, ref) => (
    <CardShell ref={ref} className={cn("w-[250px] min-h-[171px] p-4", className)} disabled={disabled} {...props}>
      <div className="grid gap-2">
        <h3 className="text-sm font-semibold leading-5">{title}</h3>
        <div className="text-sm leading-5">{description}</div>
        {action ? <div className="pt-0">{action}</div> : null}
      </div>
    </CardShell>
  ),
);
SimpleCard.displayName = "SimpleCard";

export type CardMediaTreatment = "full-bleed" | "inset" | "thumbnail";
export type CardOrientation = "vertical" | "horizontal";

export interface MediaCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  action?: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  media?: React.ReactNode;
  mediaLabel?: string;
  mediaTreatment?: CardMediaTreatment;
  orientation?: CardOrientation;
  title: React.ReactNode;
}

function MediaPlaceholder({ label = "Media placeholder" }: { label?: string }) {
  return <div role="img" aria-label={label} className="h-full w-full rounded-[inherit] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)]" />;
}

const MediaCard = React.forwardRef<HTMLElement, MediaCardProps>(
  ({ action, className, description, disabled = false, media, mediaLabel, mediaTreatment = "full-bleed", orientation = "vertical", title, ...props }, ref) => {
    const horizontal = orientation === "horizontal";
    const content = (
      <div className={cn("grid content-start gap-2", horizontal && mediaTreatment === "full-bleed" ? "flex-1 p-6" : "min-w-0 flex-1")}>
        <h3 className="text-sm font-semibold leading-5">{title}</h3>
        <div className="text-sm leading-5">{description}</div>
        {action ? <div>{action}</div> : null}
      </div>
    );
    const mediaContent = media ?? <MediaPlaceholder label={mediaLabel} />;

    if (mediaTreatment === "full-bleed") {
      return (
        <CardShell
          ref={ref}
          className={cn(horizontal ? "flex min-h-[250px] w-[700px]" : "w-[250px]", className)}
          disabled={disabled}
          {...props}
        >
          <div className={cn("shrink-0", horizontal ? "w-[300px]" : "h-[150px] w-full")}>{mediaContent}</div>
          {horizontal ? content : <div className="p-4">{content}</div>}
        </CardShell>
      );
    }

    const thumbnail = mediaTreatment === "thumbnail";
    return (
      <CardShell
        ref={ref}
        className={cn(
          "flex gap-4 p-4",
          horizontal ? (thumbnail ? "min-h-[139px] w-[500px]" : "min-h-[250px] w-[700px]") : "w-[250px] flex-col",
          className,
        )}
        disabled={disabled}
        {...props}
      >
        <div className={cn("shrink-0", thumbnail ? (horizontal ? "h-20 w-20" : "h-10 w-10") : horizontal ? "w-[300px]" : "h-[150px] w-full")}>
          {mediaContent}
        </div>
        {content}
      </CardShell>
    );
  },
);
MediaCard.displayName = "MediaCard";

export interface ProfileCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  avatar: React.ReactNode;
  disabled?: boolean;
  menuAction?: React.ReactNode;
  subtitle: React.ReactNode;
  title: React.ReactNode;
}

const ProfileCard = React.forwardRef<HTMLElement, ProfileCardProps>(
  ({ avatar, className, disabled = false, menuAction, subtitle, title, ...props }, ref) => (
    <CardShell ref={ref} className={cn("w-[250px] min-h-[131px] p-4", className)} disabled={disabled} {...props}>
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <span aria-hidden="true" />
        <div className="flex justify-center">{avatar}</div>
        <div className="flex justify-end">{menuAction}</div>
      </div>
      <div className="mt-2 grid gap-2 text-center">
        <h3 className="text-sm font-semibold leading-5">{title}</h3>
        <div className="text-sm leading-5">{subtitle}</div>
      </div>
    </CardShell>
  ),
);
ProfileCard.displayName = "ProfileCard";

export { CardShell, MediaCard, MediaPlaceholder, ProfileCard, SimpleCard };
