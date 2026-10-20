/** Safely extract a human-readable message from an unknown thrown value. */
export function getErrorMessage(err, fallback = "Something went wrong") {
    if (err instanceof Error && err.message)
        return err.message;
    if (typeof err === "string" && err)
        return err;
    if (err && typeof err === "object" && "message" in err) {
        const m = err.message;
        if (typeof m === "string" && m)
            return m;
    }
    return fallback;
}
