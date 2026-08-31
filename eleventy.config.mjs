// Eleventy config — builds src/ templates into public/ (alongside the
// hand-managed css/ images/ script/ scss/ dirs, which Eleventy never touches).
export default function (eleventyConfig) {
  // Rebuild when the Sass output (built separately) changes, so `eleventy --serve` reloads.
  eleventyConfig.addWatchTarget("public/css/");
  eleventyConfig.addWatchTarget("public/script/");

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk"],
  };
}
