} catch (error) {
    let message: any;
    if (error instanceof Error) {
        message = error.message;
    } else message = "Unknown error";
    console.error("ERROR: ", timestamp.toISOString(), " - TAG: '", tags[x], "' ", message);
}