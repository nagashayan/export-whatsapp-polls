
function findMessageId(element) {
    let current = element;
    for (let i = 0; i < 10; i++) {
        if (!current) break;
        if (current.dataset?.id) return current.dataset.id;
        current = current.parentElement;
    }
    return null;
}

function isVoteModalVisible() {
    const pollTitle = document.querySelector('h1.x1qlqyl8');
    const voteSummary = document.querySelector('span.x1nxh6w3');
    const voteRow = document.querySelector('div._ak72');
    return Boolean(pollTitle && voteSummary && voteRow);
}

function simulateViewVotesClick(event) {
    const buttonWrapper = event.target.closest('.xaw8158');
    if (!buttonWrapper) {
        console.warn('Button wrapper (.xaw8158) not found.');
        return;
    }

    const viewVotesButton = buttonWrapper.querySelector('button:not(.export-votes-button)');
    if (viewVotesButton) {
        viewVotesButton.click();
        console.log("🔘 Simulated click on View votes");
    } else {
        console.warn('"View votes" button not found in wrapper.');
    }
}

function injectExportButton(wrapper) {
    if (wrapper.isExportVoted) return;

    const clonedclass = wrapper.querySelector(".x10b6aqq");
    if (!clonedclass) return;

    const cloned = clonedclass.cloneNode(true);
    if (!cloned) return;

    cloned.textContent = "Export votes";
    cloned.classList.add("export-votes-button");

    cloned.addEventListener("click", (e) => {
        simulateViewVotesClick(e);
        setTimeout(() => {
            if (!isVoteModalVisible()) {
                alert("⚠️ Please click on ‘View votes’ manually.");
                return;
            }

            const messageId = findMessageId(e.target);
            const coreId = messageId?.split("_")?.[2];

            if (!coreId) {
                alert("Could not extract core poll ID.");
                return;
            }

            console.log("✅ Exporting for coreId:", coreId);
            window.postMessage({ export: coreId });
            e.stopPropagation();
        }, 500);
    });

    wrapper.appendChild(cloned);
    wrapper.style.justifyContent = "space-evenly";
    wrapper.isExportVoted = true;
}

function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
    console.log("📦 Injected moduleraid.js");
}

// Inject moduleraid.js after short delay
setTimeout(() => {
    injectScript(chrome.runtime.getURL('moduleraid.js'), 'body');
}, 2000);


// Watch for new poll action wrappers dynamically
const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (!(node instanceof HTMLElement)) return;

            const wrappers = node.matches(".xaw8158") ? [node] : node.querySelectorAll?.(".xaw8158") || [];
            wrappers.forEach(wrapper => {
                if (!wrapper.isExportVoted) {
                    injectExportButton(wrapper);
                }
            });
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial injection for already-loaded polls
document.querySelectorAll(".xaw8158").forEach(wrapper => {
    injectExportButton(wrapper);
});
