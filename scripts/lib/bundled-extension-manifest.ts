export type ExtensionPackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  mioclaw?: {
    install?: {
      npmSpec?: string;
    };
    releaseChecks?: {
      rootDependencyMirrorAllowlist?: string[];
    };
  };
};

export type BundledExtension = { id: string; packageJson: ExtensionPackageJson };
export type BundledExtensionMetadata = BundledExtension & {
  npmSpec?: string;
  rootDependencyMirrorAllowlist: string[];
};

export function normalizeBundledExtensionMetadata(
  extensions: BundledExtension[],
): BundledExtensionMetadata[] {
  return extensions.map((extension) => ({
    ...extension,
    npmSpec:
      typeof extension.packageJson.mioclaw?.install?.npmSpec === "string"
        ? extension.packageJson.mioclaw.install.npmSpec.trim()
        : undefined,
    rootDependencyMirrorAllowlist:
      extension.packageJson.mioclaw?.releaseChecks?.rootDependencyMirrorAllowlist?.filter(
        (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
      ) ?? [],
  }));
}

export function collectBundledExtensionManifestErrors(extensions: BundledExtension[]): string[] {
  const errors: string[] = [];

  for (const extension of extensions) {
    const install = extension.packageJson.mioclaw?.install;
    if (
      install &&
      (!install.npmSpec || typeof install.npmSpec !== "string" || !install.npmSpec.trim())
    ) {
      errors.push(
        `bundled extension '${extension.id}' manifest invalid | mioclaw.install.npmSpec must be a non-empty string`,
      );
    }

    const allowlist = extension.packageJson.mioclaw?.releaseChecks?.rootDependencyMirrorAllowlist;
    if (allowlist === undefined) {
      continue;
    }
    if (!Array.isArray(allowlist)) {
      errors.push(
        `bundled extension '${extension.id}' manifest invalid | mioclaw.releaseChecks.rootDependencyMirrorAllowlist must be an array of non-empty strings`,
      );
      continue;
    }
    const invalidEntries = allowlist.filter((entry) => typeof entry !== "string" || !entry.trim());
    if (invalidEntries.length > 0) {
      errors.push(
        `bundled extension '${extension.id}' manifest invalid | mioclaw.releaseChecks.rootDependencyMirrorAllowlist must contain only non-empty strings`,
      );
    }
  }

  return errors;
}
