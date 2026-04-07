require("esbuild").build({
    entryPoints: ["js/Main.js"],
    bundle: true,
    outfile: "dist/game.js",
    minify: true
});