import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type TestRole = "staff" | "admin" | "superadmin";

function createFakeJwt(roles: TestRole[]) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");
  const payload = Buffer.from(JSON.stringify({ roles }))
    .toString("base64url");
  return `${header}.${payload}.signature`;
}

async function mockAuthenticatedSession(page: Page, role: TestRole) {
  const token = createFakeJwt([role]);

  await page.addInitScript(([access, refresh]) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }, [token, "dummy-refresh-token"]);

  await page.route("**/api/**", async (route) => {
    const url = route.request().url();

    if (url.endsWith("/api/auth/profile/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: `${role}@example.com`,
          username: role,
          first_name: role,
          last_name: "user",
          is_active: true,
          is_staff: role !== "staff",
          date_joined: new Date().toISOString(),
        }),
      });
      return;
    }

    if (url.endsWith("/api/system/audit/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
          filters: {
            actions: ["INSERT", "UPDATE", "DELETE"],
            tables: [],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

test("unauthenticated user is redirected to login from protected route", async ({ page }) => {
  await page.goto("/app/admin/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("staff user is redirected to staff dashboard from root", async ({ page }) => {
  await mockAuthenticatedSession(page, "staff");

  await page.goto("/");
  await expect(page).toHaveURL(/\/app\/staff\/dashboard$/);
});

test("admin user is redirected to admin dashboard from root", async ({ page }) => {
  await mockAuthenticatedSession(page, "admin");

  await page.goto("/");
  await expect(page).toHaveURL(/\/app\/admin\/dashboard$/);
});

test("admin user cannot access system-audit route", async ({ page }) => {
  await mockAuthenticatedSession(page, "admin");

  await page.goto("/app/system/audit");
  await expect(page).toHaveURL(/\/unauthorized$/);
});

test("superadmin user can access system-audit route", async ({ page }) => {
  await mockAuthenticatedSession(page, "superadmin");

  await page.goto("/app/system/audit");
  await expect(page).toHaveURL(/\/app\/system\/audit$/);
});
