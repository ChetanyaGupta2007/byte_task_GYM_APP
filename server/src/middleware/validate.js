import AppError from "../utils/AppError.js";

export default function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new AppError(422, "Invalid input", details));
    }

    req[source] = result.data;
    next();
  };
}