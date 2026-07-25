import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  createTemplatedTranscriptDocx,
  templatedTranscript,
} from "./fixtures/templated-transcript-docx";


const apiBaseUrl = "http://127.0.0.1:8001/api";

async function deleteProject(request: APIRequestContext, projectId?: string) {
  if (projectId) await request.delete(`${apiBaseUrl}/projects/${projectId}`);
}

async function createProject(request: APIRequestContext, name: string) {
  const response = await request.post(`${apiBaseUrl}/projects`, {
    data: { name, description: "Playwright responsive layout project" },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: string; name: string };
}

async function selectSessionType(page: Page, label: string) {
  await page.getByRole("combobox", { name: "Session type" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

test("researcher completes the V2 Session evidence workflow", async ({ page, request }) => {
  const projectName = `E2E Project ${Date.now()}`;
  const participantName = "Alex Morgan";
  const sessionTitle = "Navigation usability interview";
  let projectId: string | undefined;

  try {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();

    await page.getByRole("link", { name: "Create project" }).first().click();
    const createProjectDialog = page.getByRole("dialog", { name: "Create project" });
    await createProjectDialog.getByLabel("Project name").fill(projectName);
    await createProjectDialog.getByLabel("Description").fill("Evidence-backed navigation research");
    const createProjectResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/projects") && response.request().method() === "POST",
    );
    await createProjectDialog.getByRole("button", { name: "Create project" }).click();
    const projectResponse = await createProjectResponse;
    expect(projectResponse.ok()).toBeTruthy();
    projectId = ((await projectResponse.json()) as { id: string }).id;
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/overview$`));
    await expect(page.getByRole("heading", { name: projectName, level: 1 })).toBeVisible();

    await page.goto(`/projects/${projectId}/participants`);
    await page.getByRole("link", { name: "Add participants" }).click();
    await page.getByLabel("First name").fill("Alex");
    await page.getByLabel("Last name").fill("Morgan");
    await page.getByLabel("Email address").fill("alex.morgan@example.com");
    await page.getByLabel("Organization").fill("Sky Research");
    await page.getByLabel("Role").fill("Research participant");
    const createParticipantResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/projects/${projectId}/participants`) && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Add participant" }).click();
    expect((await createParticipantResponse).ok()).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/participants$`));
    await expect(page.getByText(participantName, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);

    await page.goto(`/projects/${projectId}/sessions`);
    await page.getByRole("link", { name: "New session" }).first().click();
    await page.getByLabel("Session title").fill(sessionTitle);
    await selectSessionType(page, "Interview");
    const participantPicker = page.getByRole("combobox", { name: "Participants" });
    await participantPicker.click();
    await page.getByRole("option", { name: new RegExp(participantName) }).click();
    const createSessionResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/projects/${projectId}/sessions`) && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create session" }).click();
    const sessionResponse = await createSessionResponse;
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionId = ((await sessionResponse.json()) as { id: string }).id;
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/sessions/${sessionId}/overview$`));
    await expect(page.getByText(participantName, { exact: true })).toBeVisible();

    await page.goto(`/projects/${projectId}/sessions/${sessionId}/transcript`);
    const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "golden-path-interview.txt");
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    const uploadResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/projects/${projectId}/sessions/${sessionId}/documents`) && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Upload transcript" }).click();
    expect((await uploadResponse).ok()).toBeTruthy();
    await expect(page.getByText("Analysis complete", { exact: true })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: "View transcript" }).click();
    const backToTranscripts = page.getByRole("button", { name: "Back to transcripts" });
    await expect(backToTranscripts.locator("svg")).toHaveCount(1);
    const sourceText = await readFile(fixturePath, "utf8");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download source" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("golden-path-interview.txt");
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(await readFile(downloadPath as string, "utf8")).toBe(sourceText);
    await backToTranscripts.click();

    const transcriptSearch = page.getByRole("searchbox", { name: "Search this transcript" });
    const searchButton = page.getByRole("button", { name: "Search transcript" });
    const inputBox = await transcriptSearch.boundingBox();
    const buttonBox = await searchButton.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    expect(Math.abs((inputBox!.y + inputBox!.height / 2) - (buttonBox!.y + buttonBox!.height / 2))).toBeLessThanOrEqual(1);
    await transcriptSearch.fill("navigation confusing");
    await searchButton.click();
    const searchResultLink = page.getByRole("link", { name: "Open transcript context" }).first();
    const searchResult = searchResultLink.locator("xpath=ancestor::article");
    await expect(searchResult).toContainText(/dashboard navigation was confusing/i);
    await searchResultLink.click();
    await expect(page.getByRole("heading", { name: "Transcript context", level: 1 })).toBeVisible();
    await expect(page.getByText(/dashboard navigation was confusing/i)).toBeVisible();

    await page.goto(`/projects/${projectId}/sessions/${sessionId}/themes`);
    await page.getByRole("button", { name: "Generate themes" }).click();
    await expect(page.getByRole("button", { name: "Review theme" }).first()).toBeVisible({ timeout: 30_000 });

    await page.goto(`/projects/${projectId}/sessions/${sessionId}/report`);
    await page.getByRole("button", { name: "Generate Session Report" }).click();
    await expect(page.getByRole("heading", { name: "Detailed Notes" })).toBeVisible({ timeout: 30_000 });
    const detailedNotes = page.getByRole("heading", { name: "Detailed Notes" }).locator("xpath=following-sibling::p[1]");
    await expect(detailedNotes).toContainText("detailed patterns");
    await expect(detailedNotes).not.toContainText("Review each generated item");
    await page.getByRole("button", { name: "Review report" }).click();
    await expect(page.getByText("Researcher Reviewed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve report" })).toBeVisible();

    await page.goto(`/projects/${projectId}/sessions/${sessionId}/ask`);
    const question = "What evidence supports navigation confusion?";
    await page.getByRole("textbox", { name: "Ask this session" }).fill(question);
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(page.getByRole("heading", { name: "AIR answer" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Citations" })).toBeVisible();
    await page.getByRole("link", { name: "Open transcript context" }).first().click();
    await expect(page.getByRole("heading", { name: "Transcript context", level: 1 })).toBeVisible();
  } finally {
    await deleteProject(request, projectId);
  }
});

test("researcher codes structured DOCX turns and preserves the workflow across refresh", async ({ page, request }, testInfo) => {
  const project = await createProject(request, `Transcript Coding Project ${Date.now()}`);
  const codeName = "Caregiver account context";

  try {
    const sessionResponse = await request.post(`${apiBaseUrl}/projects/${project.id}/sessions`, {
      data: {
        title: "Structured transcript coding interview",
        type: "interview",
        participant_ids: [],
        related_record_ids: ["record-1"],
      },
    });
    expect(sessionResponse.ok()).toBeTruthy();
    const researchSession = (await sessionResponse.json()) as { id: string };
    const transcriptPath = testInfo.outputPath("S003_Simplified_Transcript.docx");
    await writeFile(transcriptPath, createTemplatedTranscriptDocx());

    await page.goto(`/projects/${project.id}/sessions/${researchSession.id}/transcript`);
    await page.locator('input[type="file"]').setInputFiles(transcriptPath);
    const uploadResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/projects/${project.id}/sessions/${researchSession.id}/documents`)
        && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Upload transcript" }).click();
    expect((await uploadResponse).ok()).toBeTruthy();
    await expect(page.getByText("Analysis complete", { exact: true })).toBeVisible({ timeout: 30_000 });

    const firstPassage = page.getByText(templatedTranscript.firstTurn, { exact: true });
    const firstBlock = firstPassage.locator("xpath=ancestor::article");
    const secondBlock = page
      .getByText(templatedTranscript.secondTurn, { exact: true })
      .locator("xpath=ancestor::article");
    await expect(firstBlock).toContainText("Maya Chen");
    await expect(firstBlock).toContainText("0:00");
    await expect(secondBlock).toContainText("Tanya");
    await expect(secondBlock).toContainText("3:06");
    await expect(page.getByText(/started transcription/i)).toHaveCount(0);
    await expect(page.getByText(/stopped transcription/i)).toHaveCount(0);

    await firstPassage.click();
    await page.getByRole("button", { name: "Highlight", exact: true }).click();
    const uncodedTab = page.getByRole("tab", { name: "Uncoded highlights" });
    await expect(uncodedTab).toContainText("(1)");
    await expect(page.getByRole("heading", { name: "Uncoded highlights" })).toBeVisible();

    await page.getByRole("button", { name: "Apply code" }).click();
    await page.getByRole("button", { name: "Create a new code" }).click();
    await page.getByLabel("Code name").fill(codeName);
    await page.getByLabel("Description").fill("Evidence about acting in another person's account.");
    await page.getByRole("button", { name: "Create code" }).click();
    await expect(page.getByRole("option", { name: new RegExp(codeName) })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Apply" }).click();

    const acceptedTab = page.getByRole("tab", { name: "Accepted highlights" });
    await expect(acceptedTab).toContainText("(1)");
    await expect(uncodedTab).toContainText("(0)");
    await expect(page.getByRole("heading", { name: "Accepted highlights" })).toBeVisible();
    await expect(page.getByText(codeName, { exact: true }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Transcript coding", exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Accepted highlights" }).click();
    await expect(page.getByRole("tab", { name: "Accepted highlights" })).toContainText("(1)");
    await expect(page.getByText(codeName, { exact: true }).first()).toBeVisible();

    const deleteHighlight = page.getByRole("button", { name: "Delete highlight from Maya Chen, 0:00" });
    await deleteHighlight.click();
    let deleteDialog = page.getByRole("dialog", { name: "Delete highlight?" });
    await expect(deleteDialog).toHaveCount(1);
    await deleteDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(templatedTranscript.firstTurn, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Accepted highlights" })).toContainText("(1)");

    await deleteHighlight.click();
    deleteDialog = page.getByRole("dialog", { name: "Delete highlight?" });
    await expect(deleteDialog).toHaveCount(1);
    await deleteDialog.getByRole("button", { name: "Delete highlight" }).click();
    await expect(deleteDialog).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Accepted highlights" })).toContainText("(0)");

    await page.reload();
    await expect(page.getByRole("heading", { name: "Transcript coding", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Accepted highlights" })).toContainText("(0)");
    await expect(page.getByText(templatedTranscript.firstTurn, { exact: true })).toHaveCount(1);
  } finally {
    await deleteProject(request, project.id);
  }
});

test("application shell remains aligned and usable at desktop, tablet, and mobile widths", async ({ page, request }) => {
  const project = await createProject(request, `Responsive Project ${Date.now()}`);

  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/projects/${project.id}/overview`);
    const headerContent = page.getByRole("banner").locator(":scope > div");
    const shellContent = page.locator("#main-content").locator("..");
    const headerBox = await headerContent.boundingBox();
    const shellBox = await shellContent.boundingBox();
    expect(headerBox?.width).toBe(1600);
    expect(shellBox?.width).toBe(1600);
    expect(headerBox?.x).toBe(shellBox?.x);
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeHidden();

    for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.reload();
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeHidden();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${project.id}/overview`);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  } finally {
    await deleteProject(request, project.id);
  }
});

test("researcher generates and reviews Record synthesis from eligible Sessions", async ({ page, request }) => {
  const project = await createProject(request, `Record Synthesis Project ${Date.now()}`);
  const fixturePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "golden-path-interview.txt");
  const transcript = await readFile(fixturePath);

  try {
    const settings = await request.put(`${apiBaseUrl}/settings/ai`, {
      data: {
        provider: "mock",
        model: "mock-chat",
        base_url: null,
        embedding_provider: "mock",
        embedding_model: "mock-hash-64",
      },
    });
    expect(settings.ok()).toBeTruthy();

    for (const title of ["Record checkout interview", "Record checkout usability test"]) {
      const sessionResponse = await request.post(`${apiBaseUrl}/projects/${project.id}/sessions`, {
        data: {
          title,
          type: "usability-test",
          participant_ids: [],
          related_record_ids: ["record-1"],
        },
      });
      expect(sessionResponse.ok()).toBeTruthy();
      const researchSession = (await sessionResponse.json()) as { id: string };
      const root = `${apiBaseUrl}/projects/${project.id}/sessions/${researchSession.id}`;
      const upload = await request.post(`${root}/documents`, {
        multipart: {
          file: {
            name: `${title.toLowerCase().replaceAll(" ", "-")}.txt`,
            mimeType: "text/plain",
            buffer: transcript,
          },
        },
      });
      expect(upload.ok()).toBeTruthy();
      expect((await request.post(`${root}/themes/generate`)).ok()).toBeTruthy();
      expect((await request.post(`${root}/report/generate`)).ok()).toBeTruthy();
      expect((await request.patch(`${root}/report`, { data: { status: "approved" } })).ok()).toBeTruthy();
    }

    await page.goto("/records/record-1/synthesis");
    await expect(page.getByRole("heading", { level: 1, name: "Record 1 synthesis" })).toBeVisible();
    await page.getByRole("button", { name: "Generate synthesis" }).click();
    await expect(page.getByRole("heading", { name: "Requirements" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Decisions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Action Items" })).toBeVisible();

    const firstReviewButton = page.getByRole("button", { name: "Mark reviewed" }).first();
    const firstItemTitle = await firstReviewButton.locator("xpath=ancestor::article").getByRole("heading").innerText();
    await firstReviewButton.click();
    const firstItem = page.locator("article").filter({ has: page.getByRole("heading", { name: firstItemTitle }) });
    await expect(firstItem.getByText("Researcher Reviewed", { exact: true })).toBeVisible();
    await firstItem.getByRole("button", { name: "Open evidence" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Synthesis evidence" })).toBeVisible();
    await expect(page.getByText(/dashboard navigation was confusing/i)).toBeVisible();
  } finally {
    await deleteProject(request, project.id);
  }
});
