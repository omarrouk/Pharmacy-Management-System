export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      convert: true,
    });

    if (result.error) {
      return next({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: result.error.details.map(({ path, message }) => ({
          path,
          message,
        })),
      });
    }

    if (source === "query") {
      req.validatedQuery = result.value;
    } else {
      req[source] = result.value;
    }

    return next();
  };
