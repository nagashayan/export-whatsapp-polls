function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
    console.log("injected")
}

let timeout = 2000;
setTimeout(() => {
    injectScript(chrome.runtime.getURL('moduleraid.js'), 'body');
    setInterval(() => {
        const buttonsWrapers = document.querySelectorAll(".xaw8158")
        if (buttonsWrapers) {
            buttonsWrapers.forEach(bw => {
                if (bw.isExportVoted) return;
                const clonedclass = bw.querySelector(".x10b6aqq");
                if (!clonedclass) return; // Check if clonedclass is null
                let cloned = clonedclass.cloneNode(true);
                if (!cloned) return; // Check if cloned is null
                bw.isExportVoted = true;
                cloned.textContent = "Export votes";
                cloned.style.marginLeft = "10px";
                cloned.addEventListener("click", (e) => {
                    simulateViewVotesClick(e);
                    // if (!isVoteModalVisible()) {
                    //     alert("⚠️ Please click on ‘View votes’ for this poll before exporting.");
                    //     return;
                    // }
                    console.log("exported");
                    const messageId = findMessageId(e.target);
                    const coreId = messageId?.split("_")?.[2];  // gets the part like 3EB0C8E64EF4CFE39D18
                    if (!coreId) {
                        alert("Could not extract core poll ID.");
                        return;
                    }
                    console.log("✅ Exporting for coreId:", coreId);
                    window.postMessage({ export: coreId });
                    e.stopPropagation();
                });
                bw.appendChild(cloned);
                bw.style.justifyContent = "space-evenly";
            });
        }

    }, 1000)
}, timeout);

function isVoteModalVisible() {
    const pollTitle = document.querySelector('h1.x1qlqyl8');
    const voteSummary = document.querySelector('span.x1nxh6w3');
    const voteRow = document.querySelector('div._ak72');

    return Boolean(pollTitle && voteSummary && voteRow);
}

function findMessageId(element) {
    let current = element;
    for (let i = 0; i < 10; i++) {
        if (!current) break;
        if (current.dataset?.id) return current.dataset.id;
        current = current.parentElement;
    }
    return null;
}

function simulateViewVotesClick(event) {
    // The button's wrapper (same place you appended the export button)
    const buttonWrapper = event.target.closest('.xaw8158');
    if (!buttonWrapper) {
        console.warn('Button wrapper (.xaw8158) not found.');
        return;
    }

    // Try to find the original view votes button inside the wrapper
    const viewVotesButton = buttonWrapper.querySelector('button:not(.export-votes-button)');
    if (viewVotesButton) {
        viewVotesButton.click();
        console.log("🔘 Simulated click on View votes");
    } else {
        console.warn('"View votes" button not found in wrapper.');
    }
}

