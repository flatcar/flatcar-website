document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("div.highlight").forEach(function(container) {
        const block = container.querySelector("pre code, pre");
        if (!block) return;

        // Prevent duplicates
        if (container.querySelector(".copy-btn")) return;

        const button = document.createElement("button");
        button.className = "copy-btn";
        button.textContent = "Copy";

        container.insertBefore(button, container.firstChild);

        button.addEventListener("click", function() {
            navigator.clipboard.writeText(block.innerText).then(() => {
                button.textContent = "Copied!";
                setTimeout(() => button.textContent = "Copy", 2000);
            });
        });
    });
});
