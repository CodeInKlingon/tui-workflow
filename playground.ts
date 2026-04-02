import { createWorkflow } from "./src/lib";

const workflow = createWorkflow();

// --- Define shared variables ---
const version = workflow.defineVariable("version", {
    type: "string",
    description: "The version of the application to deploy",
    defaultValue: "1.0.0",
});

const environment = workflow.defineVariable("environment", {
    type: "string",
    description: "Target deployment environment",
});

const debugMode = workflow.defineVariable("debug", {
    type: "boolean",
    description: "Enable debug mode for verbose logging",
    defaultValue: false,
});

const replicas = workflow.defineVariable("replicas", {
    type: "number",
    description: "Number of replicas to deploy",
    defaultValue: 3,
});

const region = workflow.defineVariable("region", {
    type: "string",
    description: "Cloud region for deployment",
    defaultValue: "us-east-1",
});

const timeout = workflow.defineVariable("timeout", {
    type: "number",
    description: "Request timeout in milliseconds",
    defaultValue: 30000,
});

const enableCache = workflow.defineVariable("enableCache", {
    type: "boolean",
    description: "Enable response caching layer",
    defaultValue: true,
});

const logLevel = workflow.defineVariable("logLevel", {
    type: "string",
    description: "Application log level (trace, debug, info, warn, error)",
    defaultValue: "info",
});

const maxRetries = workflow.defineVariable("maxRetries", {
    type: "number",
    description: "Maximum number of retry attempts for failed requests",
    defaultValue: 3,
});

const dbConnectionString = workflow.defineVariable("dbConnectionString", {
    type: "string",
    description: "Database connection string",
});

const enableMetrics = workflow.defineVariable("enableMetrics", {
    type: "boolean",
    description: "Enable Prometheus metrics endpoint",
    defaultValue: true,
});

const cpuLimit = workflow.defineVariable("cpuLimit", {
    type: "string",
    description: "CPU resource limit per pod",
    defaultValue: "500m",
});

const memoryLimit = workflow.defineVariable("memoryLimit", {
    type: "string",
    description: "Memory resource limit per pod",
    defaultValue: "512Mi",
});

const featureFlags = workflow.defineVariable("featureFlags", {
    type: "string",
    description: "Comma-separated list of feature flags to enable",
    defaultValue: "new-ui,dark-mode",
});

const notifySlack = workflow.defineVariable("notifySlack", {
    type: "boolean",
    description: "Send deployment notifications to Slack",
    defaultValue: false,
});

// --- Define stages that use the shared variables ---

workflow.addStage({
    title: "Stage 1: Initialize",
    key: "stage1",
    action: async ({ log, confirm, exit, spinner }) => {
        log("Initializing...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const env = await environment.get();
        log(`Target environment: ${env}`);

        const ver = await version.get();
        log(`Deploying version: ${ver}`);

        const spin = spinner();
        spin.start("Processing...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.message("Still working...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Done processing.");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const shouldExit = await confirm("We encountered something unexpected while processing. Do you want to exit?");
        if (shouldExit) exit();

        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("Initialization complete.");
    }
});

workflow.addStage({
    title: "Stage 2: Validate Configuration",
    key: "stage2",
    action: async ({ log, spinner }) => {
        log("Starting configuration validation...");
        const spin = spinner();

        const reg = await region.get();
        const timeoutVal = await timeout.get();
        const level = await logLevel.get();
        const cpu = await cpuLimit.get();
        const mem = await memoryLimit.get();

        spin.start("Checking region availability...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        log(`Region: ${reg} - available`);

        spin.message("Validating timeout settings...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log(`Timeout: ${timeoutVal}ms - within acceptable range`);

        spin.message("Checking log level...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        log(`Log level: ${level}`);

        spin.message("Validating resource limits...");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        log(`CPU limit: ${cpu}`);
        log(`Memory limit: ${mem}`);

        spin.stop("Configuration validated successfully.");
        log("All configuration values are valid.");
    }
});

workflow.addStage({
    title: "Stage 3: Database Setup",
    key: "stage3",
    action: async ({ log, progress, spinner }) => {
        const connStr = await dbConnectionString.get();
        log(`Connecting to database: ${connStr}`);

        const spin = spinner();
        spin.start("Testing database connection...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Database connection established.");

        log("Running database migrations...");
        const p = progress(100);

        await new Promise((resolve) => setTimeout(resolve, 500));
        p.advance(10, "Migration 001: Create users table");
        await new Promise((resolve) => setTimeout(resolve, 800));
        log("  ✓ Created table 'users'");

        p.advance(10, "Migration 002: Create sessions table");
        await new Promise((resolve) => setTimeout(resolve, 600));
        log("  ✓ Created table 'sessions'");

        p.advance(10, "Migration 003: Create products table");
        await new Promise((resolve) => setTimeout(resolve, 700));
        log("  ✓ Created table 'products'");

        p.advance(10, "Migration 004: Create orders table");
        await new Promise((resolve) => setTimeout(resolve, 900));
        log("  ✓ Created table 'orders'");

        p.advance(10, "Migration 005: Add indexes");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        log("  ✓ Added indexes on users.email, orders.created_at");

        p.advance(10, "Migration 006: Seed reference data");
        await new Promise((resolve) => setTimeout(resolve, 800));
        log("  ✓ Seeded 150 reference records");

        p.advance(10, "Migration 007: Create audit_log table");
        await new Promise((resolve) => setTimeout(resolve, 500));
        log("  ✓ Created table 'audit_log'");

        p.advance(10, "Migration 008: Add foreign keys");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("  ✓ Added foreign key constraints");

        p.advance(10, "Migration 009: Create views");
        await new Promise((resolve) => setTimeout(resolve, 600));
        log("  ✓ Created materialized views");

        p.advance(10, "Migration 010: Final validation");
        await new Promise((resolve) => setTimeout(resolve, 500));
        p.complete("All migrations applied");

        log("Database setup complete. 10 migrations applied successfully.");
    }
});

workflow.addStage({
    title: "Stage 4: Build & Compile",
    key: "stage4",
    action: async ({ log, progress }) => {
        const ver = await version.get();
        const debug = await debugMode.get();
        const flags = await featureFlags.get();

        log(`Building version ${ver}...`);
        log(`Feature flags: ${flags}`);
        if (debug) log("[DEBUG] Building with source maps enabled");

        const p = progress(100);

        log("Compiling TypeScript...");
        p.advance(15, "Compiling TypeScript");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        log("  ✓ 247 files compiled");

        log("Bundling application...");
        p.advance(15, "Bundling with esbuild");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        log("  ✓ Bundle size: 2.4 MB");

        log("Optimizing assets...");
        p.advance(10, "Minifying CSS");
        await new Promise((resolve) => setTimeout(resolve, 800));
        log("  ✓ CSS minified: 45 KB → 12 KB");

        p.advance(10, "Optimizing images");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("  ✓ 32 images optimized");

        p.advance(10, "Tree shaking");
        await new Promise((resolve) => setTimeout(resolve, 600));
        log("  ✓ Removed 18 unused modules");

        log("Running linter...");
        p.advance(10, "ESLint check");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("  ✓ No lint errors found");

        log("Running type check...");
        p.advance(10, "Type checking");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        log("  ✓ No type errors");

        p.advance(10, "Generating source maps");
        await new Promise((resolve) => setTimeout(resolve, 500));
        log("  ✓ Source maps generated");

        p.advance(10, "Writing build artifacts");
        await new Promise((resolve) => setTimeout(resolve, 300));
        p.complete("Build complete");

        log(`Build artifacts ready for version ${ver}.`);
    }
});

workflow.addStage({
    title: "Stage 5: Run Tests",
    key: "stage5",
    action: async ({ log, progress }) => {
        const debug = await debugMode.get();
        log("Discovering test suites...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        log("Found 8 test suites, 124 tests total.");
        if (debug) log("[DEBUG] Verbose test output enabled");

        const p = progress(124);

        const suites = [
            { name: "auth.test.ts", tests: 18 },
            { name: "users.test.ts", tests: 22 },
            { name: "products.test.ts", tests: 16 },
            { name: "orders.test.ts", tests: 20 },
            { name: "payments.test.ts", tests: 14 },
            { name: "notifications.test.ts", tests: 10 },
            { name: "analytics.test.ts", tests: 12 },
            { name: "integration.test.ts", tests: 12 },
        ];

        for (const suite of suites) {
            log(`Running ${suite.name}...`);
            await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
            p.advance(suite.tests, `${suite.name} (${suite.tests} tests)`);
            log(`  ✓ ${suite.name}: ${suite.tests} tests passed`);
        }

        p.complete("All tests passed");
        log("Test run complete: 124/124 passed, 0 failed, 0 skipped.");
    }
});

workflow.addStage({
    title: "Stage 6: Docker Build",
    key: "stage6",
    action: async ({ log, spinner, progress }) => {
        const ver = await version.get();
        const reg = await region.get();
        const cpu = await cpuLimit.get();
        const mem = await memoryLimit.get();

        log(`Building Docker image: app:${ver}`);
        log(`Target registry region: ${reg}`);

        const spin = spinner();
        spin.start("Pulling base image...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Base image pulled: node:20-alpine");

        const p = progress(100);

        log("Building image layers...");
        p.advance(10, "COPY package.json");
        await new Promise((resolve) => setTimeout(resolve, 300));
        log("  Layer 1/8: COPY package.json");

        p.advance(15, "RUN npm install");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        log("  Layer 2/8: RUN npm install (cached)");

        p.advance(10, "COPY src/");
        await new Promise((resolve) => setTimeout(resolve, 500));
        log("  Layer 3/8: COPY src/");

        p.advance(15, "RUN npm run build");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        log("  Layer 4/8: RUN npm run build");

        p.advance(10, "COPY config/");
        await new Promise((resolve) => setTimeout(resolve, 300));
        log("  Layer 5/8: COPY config/");

        p.advance(10, "Setting resource limits");
        await new Promise((resolve) => setTimeout(resolve, 400));
        log(`  Layer 6/8: ENV CPU_LIMIT=${cpu} MEMORY_LIMIT=${mem}`);

        p.advance(10, "HEALTHCHECK");
        await new Promise((resolve) => setTimeout(resolve, 300));
        log("  Layer 7/8: HEALTHCHECK --interval=30s");

        p.advance(10, "ENTRYPOINT");
        await new Promise((resolve) => setTimeout(resolve, 200));
        log("  Layer 8/8: ENTRYPOINT [\"node\", \"dist/server.js\"]");

        p.advance(10, "Finalizing image");
        await new Promise((resolve) => setTimeout(resolve, 500));
        p.complete("Image built");

        log(`Docker image built: app:${ver} (156 MB)`);
        log("Image pushed to container registry.");
    }
});

workflow.addStage({
    title: "Stage 7: Deploy to Cluster",
    key: "stage7",
    action: async ({ log, spinner, progress, confirm }) => {
        const env = await environment.get();
        const ver = await version.get();
        const numReplicas = await replicas.get();
        const metrics = await enableMetrics.get();
        const cache = await enableCache.get();

        log(`Deploying app:${ver} to ${env}...`);
        log(`Replicas: ${numReplicas}`);
        log(`Metrics: ${metrics ? "enabled" : "disabled"}`);
        log(`Caching: ${cache ? "enabled" : "disabled"}`);

        const proceed = await confirm(`Deploy version ${ver} to ${env} with ${numReplicas} replicas?`);
        if (!proceed) {
            log("Deployment cancelled by user.");
            return;
        }

        const spin = spinner();
        spin.start("Applying Kubernetes manifests...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spin.stop("Manifests applied.");

        const p = progress(numReplicas);
        for (let i = 1; i <= numReplicas; i++) {
            log(`Starting replica ${i}/${numReplicas}...`);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            p.advance(1, `Replica ${i} ready`);
            log(`  ✓ Replica ${i} is healthy`);
        }
        p.complete("All replicas running");

        log("Running post-deployment health checks...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("  ✓ /health returns 200 OK");
        log("  ✓ /ready returns 200 OK");
        if (metrics) log("  ✓ /metrics endpoint responding");

        log(`Deployment to ${env} complete.`);
    }
});

workflow.addStage({
    title: "Stage 8: Smoke Tests",
    key: "stage8",
    action: async ({ log, progress }) => {
        const env = await environment.get();
        log(`Running smoke tests against ${env}...`);

        const tests = [
            "GET /api/health → 200",
            "GET /api/v1/users → 200",
            "POST /api/v1/auth/login → 200",
            "GET /api/v1/products → 200",
            "GET /api/v1/products/1 → 200",
            "POST /api/v1/orders → 201",
            "GET /api/v1/orders/latest → 200",
            "GET /api/v1/analytics/summary → 200",
            "GET /api/v1/notifications → 200",
            "POST /api/v1/webhooks/test → 202",
        ];

        const p = progress(tests.length);
        for (const test of tests) {
            await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));
            p.advance(1, test);
            log(`  ✓ ${test}`);
        }
        p.complete("All smoke tests passed");

        log(`Smoke tests complete: ${tests.length}/${tests.length} passed.`);
    }
});

workflow.addStage({
    title: "Stage 9: Notify & Cleanup",
    key: "stage9",
    action: async ({ log, spinner }) => {
        const env = await environment.get();
        const ver = await version.get();
        const slack = await notifySlack.get();
        const retries = await maxRetries.get();

        const spin = spinner();

        if (slack) {
            spin.start("Sending Slack notification...");
            await new Promise((resolve) => setTimeout(resolve, 1500));
            spin.stop("Slack notification sent.");
            log(`Notified #deployments: "${ver} deployed to ${env}"`);
        } else {
            log("Slack notifications disabled, skipping.");
        }

        spin.start("Cleaning up temporary files...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        log("  ✓ Removed build artifacts from /tmp");
        spin.message("Clearing Docker build cache...");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        log("  ✓ Docker build cache cleared");
        spin.message("Archiving deployment logs...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        log("  ✓ Logs archived to S3");
        spin.stop("Cleanup complete.");

        log(`Max retries configured: ${retries}`);
        log("---");
        log(`Deployment pipeline complete.`);
        log(`  Version: ${ver}`);
        log(`  Environment: ${env}`);
        log(`  Status: SUCCESS`);
    }
});
