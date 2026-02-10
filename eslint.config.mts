import parser from "@typescript-eslint/parser";
import globals from "globals";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const tsconfigRootDir = dirname(__filename);

export default tseslint.config({
  files: ["src/**/*.ts", "*.mts"],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
    parser: parser,
    parserOptions: {
      projectService: {
        allowDefaultProject: [
          "eslint.config.mts",
          "eslint.config.js",
          "manifest.json",
        ],
      },
      tsconfigRootDir,
      extraFileExtensions: [".json"],
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
});
