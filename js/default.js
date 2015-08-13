"use strict";

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

$(function () {
    var wrapper = $("#codemirror-wrapper")[0]
    var codemirror = CodeMirror(wrapper, {
        value: 'console.log("And I\'m a console.log")\n\n"I\'m the result of the eval."',
        mode: "javascript",
        theme: "lesser-dark",
        lineNumbers: true,
        autofocus: true,
        styleActiveLine: true,
        gutters: ["CodeMirror-lint-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        lint: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        foldGutter: true,
        extraKeys: { "Ctrl-Space": "autocomplete" },
    });

    $("#eval-btn").on('click', function () {
        safeEval(codemirror.doc.getValue());
    })

    var evalReturn = ""

    function safeEval(code) {
        buffer = []
        try {
            var res
            (function () {
                // CONSOLE
                var console = {
                    log: __console_log,
                    debug: __console_log,
                    error: __console_error,
                    exception: __console_error,
                    info: __console_info,
                    warn: __console_warn,
                    time: __console_time,
                    timeEnd: __console_time_end,
                    timeStamp: __console_time_stamp,
                    group: __console_not_implemented_yet,
                    groupCollapsed: __console_not_implemented_yet,
                    groupEnd: __console_not_implemented_yet,
                    dir: __console_dir,
                    trace: __console_not_implemented_yet,
                    clear: __console_clear,
                    count: __console_count,
                    countReset: __console_count_reset,
                    assert: __console_assert,
                    dirxml: __console_not_implemented_yet,
                    profile: __console_not_implemented_yet,
                    profileEnd: __console_not_implemented_yet,
                }
                // END CONSOLE

                // alert, confirm, prompt
                function alert(text, title) {
                    if (title === undefined) {
                        title = "Alert"
                    }

                    (new Windows.UI.Popups.MessageDialog(text, title)).showAsync().done()
                }

                function confirm(text, title, callback) {
                    if (typeof title === 'function') {
                        callback = title
                        title = undefined
                    }
                    if (title === undefined) {
                        title = "Confirm"
                    }

                    if (callback === undefined) {
                        callback = function () {
                            alert("You must add a callback to the confirm function:\n" +
                                  "\tconfirm(text, title, callback) or confirm(text, callback)\n\n" +
                                  "For example:\n" +
                                  '\tconfirm("I\'m a message", "I\'m an optional title", "function (response) {\n' +
                                  '\t\tif(response) {\n' +
                                  '\t\t\t// User clicked [OK]\n' +
                                  '\t\t} else { \n' +
                                  '\t\t\t // User clicked [Cancel] \n' +
                                  '\t\t}' +
                                  '\n\t})\n\n' +
                                  '(WinJS doesn\'t have synchronous popups)'
                                  , "JS Evaluator Info")
                        }
                    }

                    var res = undefined

                    var md = new Windows.UI.Popups.MessageDialog(text, title)

                    md.commands.append(new Windows.UI.Popups.UICommand("OK", function (command) {
                        res = true
                    }))
                    md.commands.append(new Windows.UI.Popups.UICommand("Cancel", function (command) {
                        res = false
                    }))

                    md.showAsync().done(function () {
                        callback(res)
                    })
                }

                function prompt() {
                    alert('WinJS doesn\'t have any "prompt" function.\n' +
                          'Try using "alert" or "confirm" instead\n' +
                          "Sorry :(", "JS Evaluator Info")
                }

                evalReturn = eval(code)
            })()

            printCounters()

            var html = ""

            if (true) {
                html += '<div class="line-wrapper eval-return"><div class="line">' + format(evalReturn) + '</div></div>'
            }

            html += buffer.map(function (x) {
                return '<div class="line-wrapper"><div class="line">' + x + '</div></div>'
            }).join('')
        
            $("#result").html(html)

            return buffer
        } catch (e) {
            $("#result").html('<div class="line-wrapper"><div class="line"><span class="error"></span></div></div>')
            $(".error").text(e)
            return "ERROR: " + e
        }
    }

    // TESTS
    var testCode = 'function add(a, b) {\n\treturn a+b\n}\n\n' +
                    'console.log("I won\'t be printed :( ")\nconsole.clear()\n\n' +
                    'console.log("I\'m a console.log")\nconsole.info("I\'m a console.info")\n' +
                    'console.warn("I\'m a console.warn")\nconsole.error("I\'m a console.error")\n\n' +
                    'console.log("num %d", 123)\n\n' +
                    'console.log([1, 2, [3, 4], 5, 6])\n\n' +
                    'console.log(true)\n\nconsole.log({ attr: "value", mult: function (a, b) { return a*b } })\n\n' +
                    'console.log(null)\nconsole.log(undefined)\nconsole.log(1/0)\nconsole.log(parseInt("Not a number"))\n\n' +
                    'console.log(function (a, b) { return a+b })\nconsole.log(add)\n\n' +
                    'console.time("array")\nfor(var i = 0; i<100000; i++) {\n\tnew Array(100)\n}\nconsole.timeEnd("array")\nconsole.timeStamp("Timestamp")\n\n' +
                    'var obj = { attr: "value", number: 123, add_func: function (a, b) { return a+b; }}\nconsole.dir(obj)\n\n' +
                    'console.assert(1 === 2, "1 != 2")\n\n' +
                    'console.count("how many")\nconsole.countReset("how many")\nconsole.count("how many")\nconsole.count("how many")\n\n' +
                    'function Foo() { this.abc = "Hello"; this.circular = this; } var foo = new Foo();\n\nconsole.log(foo)\n' +
                    'console.log({ Character: { hair: { color: "blond", length: 12 }, eyes: { color: "blue" }, walk: function () { return "I\'m walking!" }, clothes: [ { type: "T-shirt", color: "red" }, { type: "jeans", color: "blue" }, { type: "shoes", color: "brown"} ] } })'
    function test() {
        safeEval(testCode)
        codemirror.setValue(testCode)
        var res = $("#result").text()
    }

    // TEST MODE
    test()
})

var strictSubstitution = false

var buffer = []
var timers = {}
var counters = {}

function __console_print(type, args) {
    if (typeof args === 'string') {
        args = [args]
    }

    var len = args.length
    var logBuffer = []

    for (var i = 0; i < len; i++) {
        var cur = i
        // Substitution strings
        if ((i === 0 || !strictSubstitution) && typeof args[i] === 'string') {
            args[i] = args[i].replace(/%[sdj]/g, function (x) {
                if (i >= len) return x
                switch (x) {
                    case '%s': return String(args[++i])
                    case '%d':
                        return Number(args[++i])
                    case '%j':
                        try {
                            return JSON.stringify(args[++i])
                        } catch (_) {
                            return '[Circular]'
                        }
                    default:
                        return x
                }
            })
        }

        logBuffer.push(format(args[cur]))
    }

    var line = logBuffer.join(' ')
    line = '<span class="' + type + '">' + line + '</span>'
    
    buffer.push(line)
}

var formatCounter = 0

function format(arg, parents, indent) {
    var maxParent = 10
    if (parents === undefined) {
        parents = []
    }

    if (indent === undefined) {
        indent = 1
    }

    if (contains(parents, arg)) {
        return '<span class="brackets">[Circular]</span>'
    }

    if (typeof arg === 'string' && parents.length > 0) {
        return '"' + htmlEntities(arg) + '"'
    } else if (Array.isArray(arg)) {
        parents.push(arg)

        if (parents.length >= maxParent) {
            return '<span class="brackets">[Array]</span>'
        }

        var ret = "[ "
        for (var i = 0, len = arg.length; i < len; i++) {
            if (i !== 0) {
                ret += ", "
            }

            ret += "<br>"
            ret += addIndent(indent)

            ret += format(arg[i], parents, indent + 1)
        }

        ret += "<br>"
        ret += addIndent(indent - 1)
        ret += " ]"

        return ret
    } else if (arg === null) {
        return '<span class="void">null</span>'
    } else if (arg === void 0) {
        return '<span class="void">undefined</span>'
    } else if (typeof arg === 'number' && (isNaN(arg) || !isFinite(arg))) {
        return '<span class="void">' + arg.toString() + '</span>'
    } else if (typeof arg === 'object' && arg !== null) {
        if (parents.length >= maxParent) {
            return '<span class="brackets">[Object]</span>'
        } else {
            parents.push(arg)
        }

        var ret = "{"

        var first = true

        for (var key in arg) {
            if (!first) {
                ret += ", "
            }
            else {
                first = false
            }

            ret += "<br>"
            ret += addIndent(indent)
            ret += key
            ret += ": "

            if (typeof arg[key] === 'function') {
                ret += '<span class="brackets">[Function]</span>'
            } else {
                ret += format(arg[key], parents, indent + 1)
            }
        }

        ret += "<br>"
        ret += addIndent(indent - 1)
        ret += "}"

        remove(parents, arg)

        return ret
    }

    return arg
}

function contains(arr, item) {
    return arr.indexOf(item) !== -1
}

function remove(arr, item) {
    var index = arr.indexOf(item)
    if (index >= 0) {
        arr.splice(index, 1);
    }
}

function addIndent(indent) {
    var str = ""

    for (var i = 0; i < indent; i++) {
        str += "&nbsp;&nbsp;&nbsp;&nbsp;"
    }

    return str
}

function __console_log() {
    __console_print("log", arguments)
}

function __console_error() {
    __console_print("error", arguments)
}

function __console_info() {
    __console_print("info", arguments)
}

function __console_warn() {
    __console_print("warn", arguments)
}

function __console_clear() {
    buffer = []
    for (var key in counters) {
        if (counters[key] === 0) {
            delete counters[key]
        }
    }
}

function __console_time(timerName) {
    timers[timerName] = new Date()
}

function __console_time_end(timerName) {
    var ms = new Date() - timers[timerName]
    __console_print("info", 'timer "' + timerName + '": ' + ms + "ms")
}

function __console_time_stamp(timeName) {
    __console_print("info", 'timestamp "' + timeName + '": ' + new Date())
}

function __console_count(counterName) {
    if (counters[counterName] === undefined) {
        counters[counterName] = 1
    } else {
        counters[counterName]++
    }
}

function __console_count_reset(counterName) {
    delete counters[counterName]
}

function printCounters() {
    for (var key in counters) {
        __console_print("info", 'counter "' + key + '": ' + counters[key])
    }
}

function __console_not_implemented_yet() {
    __console_print("warn", 'Not implemented yet')
}

function __console_dir(obj) {
    if (typeof obj === 'object') {
        __console_print("log", [obj])
    }
    else {
        __console_warn("warn", 'Console.dir given argument is not an object.')
    }
}

function __console_assert(expression) {
    if (!expression) {
        var message = Array.prototype.slice.call(arguments, 1);
        message.unshift("Assertion error: ")
        __console_print("error", message)
    }
}