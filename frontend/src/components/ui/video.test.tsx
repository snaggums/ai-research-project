import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VideoPlayer } from "@/components/ui/video";

describe("VideoPlayer", () => {
  it("keeps elapsed time aligned with the approved progress values", () => {
    render(<VideoPlayer defaultCurrentTime={83} duration={330} />);

    expect(screen.getByRole("group", { name: "Video player" })).toHaveStyle({ aspectRatio: "5 / 3" });
    expect(screen.getByLabelText("1:23 elapsed of 5:30")).toBeInTheDocument();
    const slider = screen.getByRole("slider", { name: "Video progress" });
    expect(slider).toHaveValue("83");
    expect(slider).toHaveClass("opacity-0");
    expect(document.querySelector("[data-video-controls='true']")).toHaveStyle({ backgroundColor: "var(--air-color-bg-inverse, #0f172a)" });
    expect(document.querySelector("[data-video-controls='true']")?.innerHTML).toContain("--air-color-interaction-progress");
  });

  it("toggles playback and mute controls", async () => {
    const user = userEvent.setup();
    const onMutedChange = vi.fn();
    const onPlayingChange = vi.fn();
    render(<VideoPlayer onMutedChange={onMutedChange} onPlayingChange={onPlayingChange} />);

    await user.click(screen.getByRole("button", { name: "Play video" }));
    expect(screen.getByRole("button", { name: "Pause video" })).toBeInTheDocument();
    expect(onPlayingChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: "Mute video" }));
    expect(screen.getByRole("button", { name: "Unmute video" })).toBeInTheDocument();
    expect(onMutedChange).toHaveBeenCalledWith(true);
  });

  it("updates elapsed time through its accessible progress slider", () => {
    const onTimeChange = vi.fn();
    render(<VideoPlayer duration={330} onTimeChange={onTimeChange} />);

    fireEvent.change(screen.getByRole("slider", { name: "Video progress" }), { target: { value: "248" } });
    expect(screen.getByLabelText("4:08 elapsed of 5:30")).toBeInTheDocument();
    expect(onTimeChange).toHaveBeenCalledWith(248);
  });

  it("supports optional settings and fullscreen actions", async () => {
    const user = userEvent.setup();
    const onFullscreen = vi.fn();
    const onSettings = vi.fn();
    const { rerender } = render(<VideoPlayer onFullscreen={onFullscreen} onSettings={onSettings} />);

    await user.click(screen.getByRole("button", { name: "Video settings" }));
    await user.click(screen.getByRole("button", { name: "Enter fullscreen" }));
    expect(onSettings).toHaveBeenCalledOnce();
    expect(onFullscreen).toHaveBeenCalledOnce();

    rerender(<VideoPlayer showFullscreen={false} showSettings={false} />);
    expect(screen.queryByRole("button", { name: "Video settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enter fullscreen" })).not.toBeInTheDocument();
  });
});
