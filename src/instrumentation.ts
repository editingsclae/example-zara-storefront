// Runs once when the server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { declareLayout } = await import("./lib/declare-layout");
  // Not awaited: a slow or unreachable backend must not delay the first page
  void declareLayout();
}
