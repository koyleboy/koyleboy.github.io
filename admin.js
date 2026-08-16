console.stdlog = console.log.bind(console);
console.log = function() {
    alert(Array.from(arguments).join(" "));
    console.stdlog.apply(console, arguments);
};

