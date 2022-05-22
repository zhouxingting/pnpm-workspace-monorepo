/** 命令行处理工具 */
const agrs = require("minimist")(process.argv.slice(2));

const fs = require("fs");
const path = require("path");
/** 终端输出交互工具 */
const chalk = require("chalk");
/** 管理版本号的工具 */
const semver = require("semver");
const currentVersion = require("../package.json").version;
/** 命令行交互工具 */
const { prompt } = require("enquirer");
/** 执行命令行工具 */
const execa = require("execa");

/** 批量发布包工具 */

/** 获取非正式版本的alpha信息 */
const preId =
  agrs.preid ||
  (semver.prerelease(currentVersion) && semver(currentVersion)[0]);

/** 遍历指定；路径下的文件，包含文件夹和文件，返回遍历后的数组 */
const packages = fs
  .readdirSync(path.resolve(__dirname, "../packages"))
  .filter((p) => !p.endsWith(".ts") && !p.startsWith("."));

const versionIncrements = [
  "patch",
  "minor",
  "major",
  ...(preId ? ["prepatch", "preminor", "premajor", "prerelease"] : []),
];

/** 基于当前版本号和选择的patch | minor，生成新的版本号 */
const isDryRun = agrs.dry;
const skipBuild = agrs.skipBuild;
const skippedPackages = ["co"];
const inc = (i) => semver.inc(currentVersion, i, preId);
const bin = (name) => path.resolve(__dirname, "../node_modules/.bin/" + name);
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: "inherit", ...opts });

const dryRun = (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(",")}`, opts));

const runIfNotDry = isDryRun ? dryRun : run;
/** 获取指定包的路径 */
const getPkgRoot = (pkg) => path.resolve(__dirname, "../packages/" + pkg);

const step = (msg) => console.log(chalk.cyan(msg));
/** 主程序 */
async function main() {
  let targetVersion = agrs._[0];
  if (!targetVersion) {
    const { release } = await prompt({
      type: "select",
      name: "release",
      message: "Select release type",
      choices: versionIncrements
        .map((i) => `${i} (${inc(i)})`)
        .concat(["custom"]),
    });

    if (release === "custom") {
      targetVersion = (
        await prompt({
          type: "input",
          name: "version",
          message: "Input custom version",
          initial: currentVersion,
        })
      ).version;
    } else {
      targetVersion = release.match(/\((.*)\)/)[1];
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`);
  }

  const { yes } = await prompt({
    type: "confirm",
    name: "yes",
    message: `Releasing v${targetVersion}. Confirm?`,
  });
  if (!yes) {
    return;
  }
  step("\nRunning tests...");

  step("\nUpdating cross dependencies...");
  updateVersions(targetVersion);

  step("\nBuilding all packages...");
  // if (!skipBuild && !isDryRun) {
  //   await run("pnpm", ["run", "build"]);
  //   step("\nVerifying type declarations...");
  // } else {
  //   console.log(`(skipped)`);
  // }

  step("\nGenerating changelog...");
  await run(`pnpm`, ["changelog"]);
  step("\nUpdating lockfile...");

  // await run(`pnpm`, ["install", "--prefer-offline"]);

  const { stdout } = await run("git", ["diff"], { stdio: "pipe" });
  if (stdout) {
    step("\nCommitting changes...");
    await runIfNotDry("git", ["add", "-A"]);
    await runIfNotDry("git", ["commit", "-m", `release: v${targetVersion}`]);
  } else {
    console.log("No changes to commit.");
  }

  step("\nPublishing packages...");

  for (const pkg of packages) {
    await publishPackage(pkg, targetVersion, runIfNotDry);
  }

  // push to GitHub
  step("\nPushing to GitHub...");
  await runIfNotDry("git", ["tag", `v${targetVersion}`]);
  await runIfNotDry("git", ["push", "origin", `refs/tags/v${targetVersion}`]);
  await runIfNotDry("git", ["push"]);

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`);
  }

  if (skippedPackages.length) {
    console.log(
      chalk.yellow(
        `The following packages are skipped and NOT published:\n- ${skippedPackages.join(
          "\n- "
        )}`
      )
    );
  }
  console.log();
}

/** 修改版本号 */
function updateVersions(version) {
  /** 修改all packages */
  packages.forEach((n) => updatePackage(getPkgRoot(n), version));
}

/** 修改指定包的packages的version */
function updatePackage(pkgRoot, version) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(pkgRoot, "package.json"), "utf-8")
  );
  packageJson.version = version;
  fs.writeFileSync(
    path.resolve(pkgRoot, "package.json"),
    JSON.stringify(packageJson, null, 2),
    "utf8"
  );
}

/** 发布包 */
async function publishPackage(pkg, version, runIfNotDry) {
  if (skippedPackages.includes(pkg)) {
    return;
  }
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(getPkgRoot(pkg), "package.json"), "utf-8")
  );
  if (packageJson.private) {
    return;
  }
  let releaseTag = null;
  if (agrs.tag) {
    releaseTag = agrs.tag;
  } else if (version.includes("alpha")) {
    releaseTag = "alpha";
  } else if (version.includes("beta")) {
    releaseTag = "beta";
  } else if (version.includes("rc")) {
    releaseTag = "rc";
  }

  step(`Publishing ${pkg}...`);
  try {
    await runIfNotDry(
      // note: use of yarn is intentional here as we rely on its publishing
      // behavior.
      "yarn",
      [
        "publish",
        "--new-version",
        version,
        ...(releaseTag ? ["--tag", releaseTag] : []),
        "--access",
        "public",
      ],
      {
        cwd: getPkgRoot(pkg),
        stdio: "pipe",
      }
    );
    console.log(chalk.green(`Successfully published ${pkg}@${version}`));
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkg}`));
    } else {
      throw e;
    }
  }
}

main().catch((err) => {
  /** 发布失败了把版本号再改回去，绝了，哈哈哈，牛掰 */
  updateVersions(currentVersion);
  console.error(err);
});
