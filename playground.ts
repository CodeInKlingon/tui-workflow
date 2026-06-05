import { Effect } from "effect";
import { createWorkflow, defineVariable } from "./src/lib";

const version = defineVariable("version", {
    type: "string",
    description: "The version of the application to deploy",
    defaultValue: "1.0.0",
});

const environment = defineVariable("environment", {
    type: "string",
    description: "Target deployment environment",
});

const debugMode = defineVariable("debug", {
    type: "boolean",
    description: "Enable debug mode for verbose logging",
    defaultValue: false,
});

const replicas = defineVariable("replicas", {
    type: "number",
    description: "Number of replicas to deploy",
    defaultValue: 3,
});

const region = defineVariable("region", {
    type: "string",
    description: "Cloud region for deployment",
    defaultValue: "us-east-1",
});

const timeout = defineVariable("timeout", {
    type: "number",
    description: "Request timeout in milliseconds",
    defaultValue: 30000,
});

const enableCache = defineVariable("enableCache", {
    type: "boolean",
    description: "Enable response caching layer",
    defaultValue: true,
});

const logLevel = defineVariable("logLevel", {
    type: "string",
    description: "Application log level (trace, debug, info, warn, error)",
    defaultValue: "info",
});

const maxRetries = defineVariable("maxRetries", {
    type: "number",
    description: "Maximum number of retry attempts for failed requests",
    defaultValue: 3,
});

const dbConnectionString = defineVariable("dbConnectionString", {
    type: "string",
    description: "Database connection string",
});

const enableMetrics = defineVariable("enableMetrics", {
    type: "boolean",
    description: "Enable Prometheus metrics endpoint",
    defaultValue: true,
});

const cpuLimit = defineVariable("cpuLimit", {
    type: "string",
    description: "CPU resource limit per pod",
    defaultValue: "500m",
});

const memoryLimit = defineVariable("memoryLimit", {
    type: "string",
    description: "Memory resource limit per pod",
    defaultValue: "512Mi",
});

const featureFlags = defineVariable("featureFlags", {
    type: "string",
    description: "Comma-separated list of feature flags to enable",
    defaultValue: "new-ui,dark-mode",
});

const notifySlack = defineVariable("notifySlack", {
    type: "boolean",
    description: "Send deployment notifications to Slack",
    defaultValue: false,
});

const workflow = createWorkflow({
    init: (ctx) => Effect.gen(function* () {
        ctx.log("Starting initialization...");
        
        const ver = yield* version.get;
        ctx.log(`Loading configuration for version ${ver}...`);
        
        const spin = ctx.spinner();
        spin.start("Connecting to services...");
        yield* Effect.sleep(1500);
        
        spin.message("Validating environment...");
        yield* Effect.sleep(1000);
        
        const env = yield* environment.get;
        ctx.log(`Target environment: ${env}`);
        
        spin.stop("Services connected.");
        
        const shouldProceed = yield* ctx.confirm(`Proceed with deployment to ${env}?`);
        if (!shouldProceed) {
            ctx.log("Initialization cancelled by user.");
            yield* ctx.exit;
        }
        
        ctx.log("Initialization complete. Starting workflow...");
        yield* Effect.sleep(500);
    }),
});

workflow.addStage({
    title: "Stage 2: Validate Configuration",
    key: "stage2",
    action: (ctx) => Effect.gen(function* () {
        ctx.log("Starting configuration validation...");
        const spin = ctx.spinner();

        const reg = yield* region.get;
        const timeoutVal = yield* timeout.get;
        const level = yield* logLevel.get;
        const cpu = yield* cpuLimit.get;
        const mem = yield* memoryLimit.get;

        spin.start("Checking region availability...");
        yield* Effect.sleep(1500);
        ctx.log(`Region: ${reg} - available`);

        spin.message("Validating timeout settings...");
        yield* Effect.sleep(1000);
        ctx.log(`Timeout: ${timeoutVal}ms - within acceptable range`);

        spin.message("Checking log level...");
        yield* Effect.sleep(800);
        ctx.log(`Log level: ${level}`);

        spin.message("Validating resource limits...");
        yield* Effect.sleep(1200);
        ctx.log(`CPU limit: ${cpu}`);
        ctx.log(`Memory limit: ${mem}`);

        spin.stop("Configuration validated successfully.");
        ctx.log("All configuration values are valid.");
    }),
});

workflow.addStage({
    title: "Stage 3: Database Setup",
    key: "stage3",
    action: (ctx) => Effect.gen(function* () {
        const connStr = yield* dbConnectionString.get;
        ctx.log(`Connecting to database: ${connStr}`);

        const spin = ctx.spinner();
        spin.start("Testing database connection...");
        yield* Effect.sleep(2000);
        spin.stop("Database connection established.");

        ctx.log("Running database migrations...");
        const p = ctx.progress(100);

        yield* Effect.sleep(500);
        p.advance(10, "Migration 001: Create users table");
        yield* Effect.sleep(800);
        ctx.log("  ✓ Created table 'users'");

        p.advance(10, "Migration 002: Create sessions table");
        yield* Effect.sleep(600);
        ctx.log("  ✓ Created table 'sessions'");

        p.advance(10, "Migration 003: Create products table");
        yield* Effect.sleep(700);
        ctx.log("  ✓ Created table 'products'");

        p.advance(10, "Migration 004: Create orders table");
        yield* Effect.sleep(900);
        ctx.log("  ✓ Created table 'orders'");

        p.advance(10, "Migration 005: Add indexes");
        yield* Effect.sleep(1200);
        ctx.log("  ✓ Added indexes on users.email, orders.created_at");

        p.advance(10, "Migration 006: Seed reference data");
        yield* Effect.sleep(800);
        ctx.log("  ✓ Seeded 150 reference records");

        p.advance(10, "Migration 007: Create audit_log table");
        yield* Effect.sleep(500);
        ctx.log("  ✓ Created table 'audit_log'");

        p.advance(10, "Migration 008: Add foreign keys");
        yield* Effect.sleep(1000);
        ctx.log("  ✓ Added foreign key constraints");

        p.advance(10, "Migration 009: Create views");
        yield* Effect.sleep(600);
        ctx.log("  ✓ Created materialized views");

        p.advance(10, "Migration 010: Final validation");
        yield* Effect.sleep(500);
        p.complete("All migrations applied");

        ctx.log("Database setup complete. 10 migrations applied successfully.");
    }),
});

workflow.addStage({
    title: "Stage 4: Build & Compile",
    key: "stage4",
    action: (ctx) => Effect.gen(function* () {
        const ver = yield* version.get;
        const debug = yield* debugMode.get;
        const flags = yield* featureFlags.get;

        ctx.log(`Building version ${ver}...`);
        ctx.log(`Feature flags: ${flags}`);
        if (debug) ctx.log("[DEBUG] Building with source maps enabled");

        const p = ctx.progress(100);

        ctx.log("Compiling TypeScript...");
        p.advance(15, "Compiling TypeScript");
        yield* Effect.sleep(1500);
        ctx.log("  ✓ 247 files compiled");

        ctx.log("Bundling application...");
        p.advance(15, "Bundling with esbuild");
        yield* Effect.sleep(1200);
        ctx.log("  ✓ Bundle size: 2.4 MB");

        ctx.log("Optimizing assets...");
        p.advance(10, "Minifying CSS");
        yield* Effect.sleep(800);
        ctx.log("  ✓ CSS minified: 45 KB → 12 KB");

        p.advance(10, "Optimizing images");
        yield* Effect.sleep(1000);
        ctx.log("  ✓ 32 images optimized");

        p.advance(10, "Tree shaking");
        yield* Effect.sleep(600);
        ctx.log("  ✓ Removed 18 unused modules");

        ctx.log("Running linter...");
        p.advance(10, "ESLint check");
        yield* Effect.sleep(1000);
        ctx.log("  ✓ No lint errors found");

        ctx.log("Running type check...");
        p.advance(10, "Type checking");
        yield* Effect.sleep(1500);
        ctx.log("  ✓ No type errors");

        p.advance(10, "Generating source maps");
        yield* Effect.sleep(500);
        ctx.log("  ✓ Source maps generated");

        p.advance(10, "Writing build artifacts");
        yield* Effect.sleep(300);
        p.complete("Build complete");

        ctx.log(`Build artifacts ready for version ${ver}.`);
    }),
});

workflow.addStage({
    title: "Stage 5: Run Tests",
    key: "stage5",
    action: (ctx) => Effect.gen(function* () {
        const debug = yield* debugMode.get;
        ctx.log("Discovering test suites...");
        yield* Effect.sleep(500);
        ctx.log("Found 8 test suites, 124 tests total.");
        if (debug) ctx.log("[DEBUG] Verbose test output enabled");

        const p = ctx.progress(124);

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
            ctx.log(`Running ${suite.name}...`);
            yield* Effect.sleep(800 + Math.random() * 1200);
            p.advance(suite.tests, `${suite.name} (${suite.tests} tests)`);
            ctx.log(`  ✓ ${suite.name}: ${suite.tests} tests passed`);
        }

        p.complete("All tests passed");
        ctx.log("Test run complete: 124/124 passed, 0 failed, 0 skipped.");
    }),
});

workflow.addStage({
    title: "Stage 6: Docker Build",
    key: "stage6",
    action: (ctx) => Effect.gen(function* () {
        const ver = yield* version.get;
        const reg = yield* region.get;
        const cpu = yield* cpuLimit.get;
        const mem = yield* memoryLimit.get;

        ctx.log(`Building Docker image: app:${ver}`);
        ctx.log(`Target registry region: ${reg}`);

        const spin = ctx.spinner();
        spin.start("Pulling base image...");
        yield* Effect.sleep(2000);
        spin.stop("Base image pulled: node:20-alpine");

        const p = ctx.progress(100);

        ctx.log("Building image layers...");
        p.advance(10, "COPY package.json");
        yield* Effect.sleep(300);
        ctx.log("  Layer 1/8: COPY package.json");

        p.advance(15, "RUN npm install");
        yield* Effect.sleep(2000);
        ctx.log("  Layer 2/8: RUN npm install (cached)");

        p.advance(10, "COPY src/");
        yield* Effect.sleep(500);
        ctx.log("  Layer 3/8: COPY src/");

        p.advance(15, "RUN npm run build");
        yield* Effect.sleep(1500);
        ctx.log("  Layer 4/8: RUN npm run build");

        p.advance(10, "COPY config/");
        yield* Effect.sleep(300);
        ctx.log("  Layer 5/8: COPY config/");

        p.advance(10, "Setting resource limits");
        yield* Effect.sleep(400);
        ctx.log(`  Layer 6/8: ENV CPU_LIMIT=${cpu} MEMORY_LIMIT=${mem}`);

        p.advance(10, "HEALTHCHECK");
        yield* Effect.sleep(300);
        ctx.log("  Layer 7/8: HEALTHCHECK --interval=30s");

        p.advance(10, "ENTRYPOINT");
        yield* Effect.sleep(200);
        ctx.log("  Layer 8/8: ENTRYPOINT [\"node\", \"dist/server.js\"]");

        p.advance(10, "Finalizing image");
        yield* Effect.sleep(500);
        p.complete("Image built");

        ctx.log(`Docker image built: app:${ver} (156 MB)`);
        ctx.log("Image pushed to container registry.");
    }),
});

workflow.addStage({
    title: "Stage 7: Deploy to Cluster",
    key: "stage7",
    action: (ctx) => Effect.gen(function* () {
        const env = yield* environment.get;
        const ver = yield* version.get;
        const numReplicas = yield* replicas.get;
        const metrics = yield* enableMetrics.get;
        const cache = yield* enableCache.get;

        ctx.log(`Deploying app:${ver} to ${env}...`);
        ctx.log(`Replicas: ${numReplicas}`);
        ctx.log(`Metrics: ${metrics ? "enabled" : "disabled"}`);
        ctx.log(`Caching: ${cache ? "enabled" : "disabled"}`);

        const proceed = yield* ctx.confirm(`Deploy version ${ver} to ${env} with ${numReplicas} replicas?`);
        if (!proceed) {
            ctx.log("Deployment cancelled by user.");
            return;
        }

        const spin = ctx.spinner();
        spin.start("Applying Kubernetes manifests...");
        yield* Effect.sleep(2000);
        spin.stop("Manifests applied.");

        const p = ctx.progress(numReplicas);
        for (let i = 1; i <= numReplicas; i++) {
            ctx.log(`Starting replica ${i}/${numReplicas}...`);
            yield* Effect.sleep(1500);
            p.advance(1, `Replica ${i} ready`);
            ctx.log(`  ✓ Replica ${i} is healthy`);
        }
        p.complete("All replicas running");

        ctx.log("Running post-deployment health checks...");
        yield* Effect.sleep(1000);
        ctx.log("  ✓ /health returns 200 OK");
        ctx.log("  ✓ /ready returns 200 OK");
        if (metrics) ctx.log("  ✓ /metrics endpoint responding");

        ctx.log(`Deployment to ${env} complete.`);
    }),
});

workflow.addStage({
    title: "Stage 8: Smoke Tests",
    key: "stage8",
    action: (ctx) => Effect.gen(function* () {
        const env = yield* environment.get;
        ctx.log(`Running smoke tests against ${env}...`);

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

        const p = ctx.progress(tests.length);
        for (const test of tests) {
            yield* Effect.sleep(600 + Math.random() * 800);
            p.advance(1, test);
            ctx.log(`  ✓ ${test}`);
        }
        p.complete("All smoke tests passed");

        ctx.log(`Smoke tests complete: ${tests.length}/${tests.length} passed.`);
    }),
});

workflow.addStage({
    title: "Stage 8: Select Features",
    key: "stage8_features",
    action: (ctx) => Effect.gen(function* () {
        const features = yield* ctx.checkboxGroup({
            options: [
                { id: 'auth', name: 'Authentication', category: 'Security' },
                { id: 'logging', name: 'Audit Logging', category: 'Monitoring' },
                { id: 'cache', name: 'Redis Cache', category: 'Performance' },
                { id: 'ssl', name: 'SSL Termination', category: 'Security' },
                { id: 'metrics', name: 'Prometheus Metrics', category: 'Monitoring' },
            ],
            label: (opt) => `${opt.name} (${opt.category})`,
            title: 'Select Features to Enable'
        });

        ctx.log(`Selected ${features.length} features:`);
        for (const feature of features) {
            ctx.log(`  ✓ ${feature.name} (${feature.category})`);
        }
    }),
});

workflow.addStage({
    title: "Stage 9: Notify & Cleanup",
    key: "stage9",
    action: (ctx) => Effect.gen(function* () {
        const env = yield* environment.get;
        const ver = yield* version.get;
        const slack = yield* notifySlack.get;
        const retries = yield* maxRetries.get;

        const spin = ctx.spinner();

        if (slack) {
            spin.start("Sending Slack notification...");
            yield* Effect.sleep(1500);
            spin.stop("Slack notification sent.");
            ctx.log(`Notified #deployments: "${ver} deployed to ${env}"`);
        } else {
            ctx.log("Slack notifications disabled, skipping.");
        }

        spin.start("Cleaning up temporary files...");
        yield* Effect.sleep(1000);
        ctx.log("  ✓ Removed build artifacts from /tmp");
        spin.message("Clearing Docker build cache...");
        yield* Effect.sleep(1200);
        ctx.log("  ✓ Docker build cache cleared");
        spin.message("Archiving deployment logs...");
        yield* Effect.sleep(800);
        ctx.log("  ✓ Logs archived to S3");
        spin.stop("Cleanup complete.");

        ctx.log(`Max retries configured: ${retries}`);
        ctx.log("---");
        ctx.log(`Deployment pipeline complete.`);
        ctx.log(`  Version: ${ver}`);
        ctx.log(`  Environment: ${env}`);
        ctx.log(`  Status: SUCCESS`);
    }),
});