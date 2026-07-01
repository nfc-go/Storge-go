/**
 * NebulaDrive Cryptographic Access Control & Identity Layer
 * Architecture: Prefixed Multi-Tenant PIN Loops
 */

class AuthEngine {
    constructor() {
        this._activeWorkspaceId = "client_default";
        this._isAuthenticated = false;
        this._activeUser = "";
        this._isRegistrationMode = true;

        this.appContainer = document.getElementById("app-container");
        this.overlayLayer = document.getElementById("modal-overlay-layer");
        this.authCard = document.getElementById("modal-auth-container");
        this.errorFeedback = document.getElementById("auth-error-feedback");
        this.errorText = document.getElementById("txt-error-message");
        this.authForm = document.getElementById("auth-validation-form");
        this.usernameField = document.getElementById("auth-reg-username");
        this.usernameGroup = this.usernameField ? this.usernameField.closest(".form-group") : null;
        this.submitButtonLabel = document.getElementById("txt-auth-btn-label");
        this.authTitle = document.getElementById("txt-auth-title");
        this.authDesc = document.getElementById("txt-auth-desc");
        this.profileNameLabel = document.getElementById("txt-profile-name");

        this.pinBoxes = [
            document.getElementById("pin-char-1"),
            document.getElementById("pin-char-2"),
            document.getElementById("pin-char-3"),
            document.getElementById("pin-char-4")
        ];

        this.handleWorkspaceShift = this.handleWorkspaceShift.bind(this);
        this.executeFormSubmission = this.executeFormSubmission.bind(this);
        this.handlePinKeyDown = this.handlePinKeyDown.bind(this);
        this.handlePinInput = this.handlePinInput.bind(this);
    }

    initialize() {
        window.addEventListener("nebula:workspaceChanged", this.handleWorkspaceShift);
        if (this.authForm) this.authForm.addEventListener("submit", this.executeFormSubmission);

        for (let i = 0; i < this.pinBoxes.length; i++) {
            if (this.pinBoxes[i]) {
                this.pinBoxes[i].addEventListener("input", (e) => this.handlePinInput(e, i));
                this.pinBoxes[i].addEventListener("keydown", (e) => this.handlePinKeyDown(e, i));
            }
        }
    }

    handleWorkspaceShift(event) {
        if (!event || !event.detail || !event.detail.workspaceId) return;
        this._activeWorkspaceId = event.detail.workspaceId;
        this._isAuthenticated = false;

        if (this.appContainer) this.appContainer.classList.add("blurred");
        if (this.overlayLayer) this.overlayLayer.classList.remove("hidden");
        if (this.errorFeedback) this.errorFeedback.classList.add("hidden");
        this.clearPinInputs();

        const authMetaKey = `${this._activeWorkspaceId}_vault_auth_meta`;
        const cachedMetaRaw = localStorage.getItem(authMetaKey);

        if (cachedMetaRaw) {
            this._isRegistrationMode = false;
            if (this.usernameGroup) this.usernameGroup.classList.add("hidden");
            if (this.usernameField) this.usernameField.removeAttribute("required");
            if (this.authTitle) this.authTitle.textContent = "Unlock Storage Matrix";
            if (this.authDesc) this.authDesc.textContent = "Enter your 4-digit Master PIN to decrypt this sandbox.";
            if (this.submitButtonLabel) this.submitButtonLabel.textContent = "Verify Credentials";
        } else {
            this._isRegistrationMode = true;
            if (this.usernameGroup) this.usernameGroup.classList.remove("hidden");
            if (this.usernameField) {
                this.usernameField.setAttribute("required", "required");
                this.usernameField.value = "";
            }
            if (this.authTitle) this.authTitle.textContent = "Initialize Sandbox Vault";
            if (this.authDesc) this.authDesc.textContent = "Set a node name and a 4-digit Master PIN.";
            if (this.submitButtonLabel) this.submitButtonLabel.textContent = "Create Partition";
        }
    }

    handlePinInput(event, index) {
        const inputField = event.target;
        const enteredVal = inputField.value;
        if (enteredVal.length > 0) {
            inputField.value = enteredVal.replace(/[^0-9]/g, "");
            if (inputField.value.length > 0 && index < this.pinBoxes.length - 1) {
                const nextBox = this.pinBoxes[index + 1];
                if (nextBox) { nextBox.focus(); nextBox.select(); }
            }
        }
    }

    handlePinKeyDown(event, index) {
        if (event.key === "Backspace") {
            const inputField = event.target;
            if (inputField.value.length === 0 && index > 0) {
                const prevBox = this.pinBoxes[index - 1];
                if (prevBox) { prevBox.focus(); prevBox.value = ""; event.preventDefault(); }
            } else {
                inputField.value = "";
            }
        }
    }

    assemblePinString() {
        let pin = "";
        for (let i = 0; i < this.pinBoxes.length; i++) {
            if (this.pinBoxes[i]) pin += this.pinBoxes[i].value;
        }
        return pin;
    }

    clearPinInputs() {
        this.pinBoxes.forEach(box => { if (box) box.value = ""; });
        if (this.pinBoxes[0]) this.pinBoxes[0].focus();
    }

    computeFletcherHash(str) {
        let sumA = 255, sumB = 255;
        for (let i = 0; i < str.length; i++) {
            sumA = (sumA + str.charCodeAt(i)) % 255;
            sumB = (sumB + sumA) % 255;
        }
        return ((sumB << 8) | sumA).toString(16).toUpperCase();
    }

    executeFormSubmission(event) {
        if (event) event.preventDefault();
        const gatheredPin = this.assemblePinString();

        if (gatheredPin.length !== 4) {
            this.revealError("Incomplete 4-digit Master PIN format.");
            return;
        }

        const authMetaKey = `${this._activeWorkspaceId}_vault_auth_meta`;
        const computedHash = this.computeFletcherHash(gatheredPin);

        if (this._isRegistrationMode) {
            const username = this.usernameField ? this.usernameField.value.trim() : "";
            if (username.length < 2) {
                this.revealError("Username minimum length is 2 characters.");
                return;
            }
            localStorage.setItem(authMetaKey, JSON.stringify({
                username: username, pinSignature: computedHash, createdOn: new Date().toISOString()
            }));
            this._activeUser = username;
            this.grantClearance();
        } else {
            const storedRaw = localStorage.getItem(authMetaKey);
            if (!storedRaw) return;
            const meta = JSON.parse(storedRaw);

            if (computedHash === meta.pinSignature) {
                this._activeUser = meta.username || "Authenticated Node";
                this.grantClearance();
            } else {
                this.revealError("Access Denied: PIN incorrect.");
                this.clearPinInputs();
            }
        }
    }

    grantClearance() {
        this._isAuthenticated = true;
        if (this.appContainer) this.appContainer.classList.remove("blurred");
        if (this.overlayLayer) this.overlayLayer.classList.add("hidden");
        if (this.profileNameLabel) this.profileNameLabel.textContent = this._activeUser;

        window.dispatchEvent(new CustomEvent("nebula:authSuccess", {
            detail: { workspaceId: this._activeWorkspaceId, username: this._activeUser },
            bubbles: true
        }));
    }

    revealError(msg) {
        if (this.errorFeedback && this.errorText) {
            this.errorText.textContent = msg;
            this.errorFeedback.classList.remove("hidden");
        }
    }
}

const globalAuthEngine = new AuthEngine();
document.addEventListener("DOMContentLoaded", () => globalAuthEngine.initialize());
