}  catch (error) {
    let message: any;
    if (error instanceof Error) {
        message = error.message;
    } else message = "Unknown error";
    console.error((new Date().toISOString()), message);
}