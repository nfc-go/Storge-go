/**
 * NebulaDrive Client-Side Sandbox Routing Engine
 * Architecture: Hash-Based Dynamic Workspace Extractor
 */

class SandboxRouter {
    constructor() {
        this.DEFAULT_WORKSPACE = "client_default";
        this.currentWorkspaceId = this.DEFAULT_WORKSPACE;
        this.handleRoutingContext = this.handleRoutingContext.bind(this);
    }

    initialize() {
        window.addEventListener("hashchange", this.handleRoutingContext);
        window.addEventListener("load", this.handleRoutingContext);
        this.handleRoutingContext();
    }

    handleRoutingContext() {
        const hashPayload = window.location.hash || "";
        const extractedWorkspace = this.extractWorkspaceFromHash(hashPayload);
        this.currentWorkspaceId = extractedWorkspace;
        this.broadcastWorkspaceShift(this.currentWorkspaceId);
    }

    extractWorkspaceFromHash(hashString) {
        if (!hashString || hashString === "#" || hashString === "") {
            return this.DEFAULT_WORKSPACE;
        }
        const workspaceRegex = /#workspace=([^&]*)/;
        const matchResult = hashString.match(workspaceRegex);

        if (matchResult && matchResult[1]) {
            const parsedToken = matchResult[1].trim();
            if (parsedToken.length === 0) return this.DEFAULT_WORKSPACE;
            return encodeURIComponent(parsedToken);
        }
        return this.DEFAULT_WORKSPACE;
    }

    broadcastWorkspaceShift(workspaceId) {
        const workspaceEvent = new CustomEvent("nebula:workspaceChanged", {
            detail: { workspaceId: workspaceId, timestamp: Date.now() },
            bubbles: true,
            cancelable: false
        });
        window.dispatchEvent(workspaceEvent);
    }

    navigateToWorkspace(targetWorkspaceId) {
        if (!targetWorkspaceId || targetWorkspaceId.trim().length === 0) {
            window.location.hash = `workspace=${this.DEFAULT_WORKSPACE}`;
        } else {
            window.location.hash = `workspace=${encodeURIComponent(targetWorkspaceId.trim())}`;
        }
    }
}

const globalSandboxRouter = new SandboxRouter();
globalSandboxRouter.initialize();
