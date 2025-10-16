// ============================================================
// Prevent recursive modification of the logger itself
// ============================================================
if (process.env.SKIP_LOGGER_UPDATE === "true") {
  console.log("⏭️  Skipping logger import patch (env flag set)");
  process.exit(0);
}
