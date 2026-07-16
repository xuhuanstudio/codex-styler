import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../schema/theme.schema.json";
import type {
  ThemeDefinition,
  ThemeValidationIssue,
  ThemeValidationResult,
} from "./types";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  allowUnionTypes: true,
});

addFormats(ajv);

const validateThemeSchema = ajv.compile<ThemeDefinition>(schema);

function issueFromAjv(error: ErrorObject): ThemeValidationIssue {
  return {
    path: error.instancePath || "/",
    message: error.message ?? "Invalid value",
  };
}

function validateAssetRelationships(theme: ThemeDefinition): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];
  const paths = new Set(theme.assets.map((asset) => asset.path));
  const ids = new Set<string>();

  for (const [index, asset] of theme.assets.entries()) {
    if (ids.has(asset.id)) {
      issues.push({
        path: "/assets/" + index + "/id",
        message: "Asset ids must be unique",
      });
    }
    ids.add(asset.id);
  }

  const referenced = new Set<string>();
  for (const variant of Object.values(theme.variants)) {
    if (variant.background.image) referenced.add(variant.background.image);
  }
  for (const layer of theme.scene.layers) {
    if (layer.asset) referenced.add(layer.asset);
  }
  for (const entity of theme.scene.entities) {
    referenced.add(entity.renderer.asset);
  }
  if (theme.metadata.preview) referenced.add(theme.metadata.preview);

  for (const path of referenced) {
    if (!paths.has(path)) {
      issues.push({
        path: "/assets",
        message: "Referenced asset is not declared: " + path,
      });
    }
  }

  return issues;
}

export function validateTheme(input: unknown): ThemeValidationResult {
  const valid = validateThemeSchema(input);
  const issues = valid
    ? validateAssetRelationships(input as ThemeDefinition)
    : (validateThemeSchema.errors ?? []).map(issueFromAjv);

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function assertTheme(input: unknown): asserts input is ThemeDefinition {
  const result = validateTheme(input);
  if (!result.ok) {
    throw new Error(
      result.issues
        .map((issue) => issue.path + ": " + issue.message)
        .join("\n"),
    );
  }
}

