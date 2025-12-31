/**
 * Editor Module
 * CodeMirror initialization and custom mode definition
 */

window.MCTools = window.MCTools || {};

/**
 * Define custom JSON mode for CodeMirror
 * Highlights keys starting with underscore as comments
 */
CodeMirror.defineMode("customjson", function (config) {
    var jsonMode = CodeMirror.getMode(config, { name: "javascript", json: true });

    return {
        startState: function () { return jsonMode.startState(); },

        token: function (stream, state) {
            if (stream.peek() === '"') {
                stream.next();
                let key = "";
                while (!stream.eol()) {
                    const ch = stream.next();
                    if (ch === '"') break;
                    key += ch;
                }
                const ahead = stream.string.slice(stream.pos).trimStart();
                if (ahead.startsWith(":")) {
                    if (key.startsWith("_")) return "comment";
                    return "property";
                }
                return "string";
            }
            var style = jsonMode.token(stream, state);
            return style;
        },

        indent: function (state, textAfter) {
            return jsonMode.indent && jsonMode.indent(state, textAfter);
        },
        electricChars: jsonMode.electricChars,
        innerMode: function (state) {
            return { state: state, mode: jsonMode };
        },
        blankLine: function (state) {
            if (jsonMode.blankLine) jsonMode.blankLine(state);
        }
    };
});

/**
 * Initialize CodeMirror editor
 */
window.MCTools.initEditor = function () {
    const textarea = document.getElementById('editor');
    window.MCTools.codeEditor = CodeMirror.fromTextArea(textarea, {
        mode: "customjson",
        theme: "dracula",
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        showCursorWhenSelecting: true,
        extraKeys: { "Tab": "indentMore", "Shift-Tab": "indentLess" }
    });

    // Add placeholder text
    const placeholderText = "Paste your config.json here or upload a file...";
    const placeholderEl = document.createElement('span');
    placeholderEl.textContent = placeholderText;
    placeholderEl.style.color = '#8b949e';
    placeholderEl.style.position = 'absolute';
    placeholderEl.style.pointerEvents = 'none';
    placeholderEl.style.padding = '16px';
    placeholderEl.style.zIndex = '10';
    window.MCTools.codeEditor.getWrapperElement().appendChild(placeholderEl);

    function updatePlaceholder() {
        placeholderEl.style.display = window.MCTools.codeEditor.getValue() === '' ? 'block' : 'none';
    }
    updatePlaceholder();
    window.MCTools.codeEditor.on('change', updatePlaceholder);
};
