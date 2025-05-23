import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";
import tailwindcssPlugin from "@tailwindcss/vite"

import path from "path";
import { fileURLToPath } from "url";
import vitePluginChecker from "vite-plugin-checker";

import aliases from "./aliases.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./tests/ct",
    /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
    snapshotDir: "./__snapshots__",
    /* Maximum time one test can run for. */
    timeout: 10 * 1000,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",

        /* Port to use for Playwright component endpoint. */
        ctPort: 3100,
        ctViteConfig: {
            plugins: [
                // @ts-expect-error -- CT uses wrong version of vite, so types dont match
                react(),
                // @ts-expect-error -- se above
                vitePluginChecker({ typescript: true }),
                // @ts-expect-error -- se above
                tailwindcssPlugin()
            ],
            resolve: {
                alias: Object.keys(aliases.compilerOptions.paths).reduce(
                    (prev, current) => ({
                        ...prev,
                        [current.replace("/*", "")]: path.resolve(
                            __dirname,
                            aliases.compilerOptions.paths[current][0].replace("/*", "")
                        ),
                    }),
                    {}
                ),
            },
        },
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],
});
