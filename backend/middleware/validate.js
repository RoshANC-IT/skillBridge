import { body, param, query, validationResult } from "express-validator";

export const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

// ---------- JOBS ----------
export const createJobRules = [
  body("title").trim().isLength({ min: 3 }).withMessage("Title ≥ 3 chars"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description ≥ 10 chars"),
  body("category").optional().isString(),
  body("salary").optional().isFloat({ min: 0 }),
  // location is optional for now; later we can enforce GeoJSON
  body("location").optional().custom((v) => {
    if (!v) return true;
    if (typeof v !== "object") throw new Error("location must be an object");
    return true;
  }),
];

export const jobIdParam = [ param("jobId").isMongoId().withMessage("Invalid jobId") ];

// ---------- APPLICATIONS ----------
export const applyRules = [
  ...jobIdParam,
  body("coverLetter")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Cover letter ≥ 10 chars"),
];

export const decisionRules = [
  ...jobIdParam,
  param("workerId").isMongoId().withMessage("Invalid workerId"),
];

// ---------- DASHBOARDS ----------
export const paginationRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];
