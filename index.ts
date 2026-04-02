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

// --- Define stages that use the shared variables ---

workflow.addStage({
    title: "Stage 1: Initialize",
    key: "stage1",
    action: async ({ log, confirm, exit, spinner }) => {
        log("Initializing...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // This will prompt the user since 'environment' has no default
        const env = await environment.get();
        log(`Target environment: ${env}`);

        // This will prompt with pre-filled default "1.0.0"
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
    title: "Stage 2: Process Data",
    key: "stage2",
    action: async ({ log, progress }) => {
        // These will resolve immediately if already set in Stage 1
        const ver = await version.get();
        const debug = await debugMode.get();
        const numReplicas = await replicas.get();
        log(`Processing data for version ${ver}...`);
        if (debug) {
            log("[DEBUG] Debug mode is ON");
        }
        log(`Scaling to ${numReplicas} replicas`);

        const p = progress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));
        p.advance(25, "Fetching profiles");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.advance(25, "Validating records");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.advance(25, "Saving changes");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        p.complete("All done");
        log("Data processed.");
    }
});
