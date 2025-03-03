import { PROJEN_DIR, PROJEN_RC, PROJEN_VERSION } from './common';
import { AutoMerge, DependabotOptions, GithubWorkflow, workflows } from './github';
import { MergifyOptions } from './github/mergify';
import { JobPermission } from './github/workflows-model';
import { IgnoreFile } from './ignore-file';
import { Projenrc, ProjenrcOptions } from './javascript/projenrc';
import { Jest, JestOptions } from './jest';
import { License } from './license';
import { NodePackage, NpmTaskExecution, NodePackageManager, NodePackageOptions } from './node-package';
import { Project, ProjectOptions } from './project';
import { Publisher } from './publisher';
import { Release, ReleaseProjectOptions } from './release';
import { Task, TaskCategory } from './tasks';
import { UpgradeDependencies, UpgradeDependenciesOptions, UpgradeDependenciesSchedule } from './upgrade-dependencies';
import { Version } from './version';

const PROJEN_SCRIPT = 'projen';

export interface NodeProjectOptions extends ProjectOptions, NodePackageOptions, ReleaseProjectOptions {
  /**
   * License copyright owner.
   *
   * @default - defaults to the value of authorName or "" if `authorName` is undefined.
   */
  readonly copyrightOwner?: string;

  /**
   * The copyright years to put in the LICENSE file.
   *
   * @default - current year
   */
  readonly copyrightPeriod?: string;


  /**
   * Version of projen to install.
   *
   * @default - Defaults to the latest version.
   */
  readonly projenVersion?: string;

  /**
   * Indicates of "projen" should be installed as a devDependency.
   *
   * @default true
   */
  readonly projenDevDependency?: boolean;

  /**
   * Define a GitHub workflow for building PRs.
   * @default - true if not a subproject
   */
  readonly buildWorkflow?: boolean;

  /**
   * Automatically update files modified during builds to pull-request branches. This means
   * that any files synthesized by projen or e.g. test snapshots will always be up-to-date
   * before a PR is merged.
   *
   * Implies that PR builds do not have anti-tamper checks.
   *
   * @default true
   */
  readonly mutableBuild?: boolean;

  /**
   * Define a GitHub workflow step for sending code coverage metrics to https://codecov.io/
   * Uses codecov/codecov-action@v1
   * A secret is required for private repos. Configured with @codeCovTokenSecret
   * @default false
   */
  readonly codeCov?: boolean;

  /**
   * Define the secret name for a specified https://codecov.io/ token
   * A secret is required to send coverage for private repositories
   * @default - if this option is not specified, only public repositories are supported
   */
  readonly codeCovTokenSecret?: string;

  /**
   * Define a GitHub workflow for releasing from "main" when new versions are
   * bumped. Requires that `version` will be undefined.
   *
   * @default - true if not a subproject
   * @featured
   */
  readonly releaseWorkflow?: boolean;

  /**
   * Workflow steps to use in order to bootstrap this repo.
   *
   * @default "yarn install --frozen-lockfile && yarn projen"
   */
  readonly workflowBootstrapSteps?: any[];

  /**
   * Automatically release to npm when new versions are introduced.
   * @default false
   */
  readonly releaseToNpm?: boolean;

  /**
   * The node version to use in GitHub workflows.
   *
   * @default - same as `minNodeVersion`
   */
  readonly workflowNodeVersion?: string;

  /**
   * Include dependabot configuration.
   *
   * @deprecated - use `depsUpgrade: DependenciesUpgrade.dependabot`
   * @default false
   */
  readonly dependabot?: boolean;

  /**
   * Options for dependabot.
   *
   * @deprecated - use `depsUpgrade: DependenciesUpgrade.dependabot`
   * @default - default options
   */
  readonly dependabotOptions?: DependabotOptions;

  /**
   * How to handle dependency upgrades.
   *
   * @default - DependenciesUpgrade.GITHUB_ACTIONS
   */
  readonly depsUpgrade?: DependenciesUpgradeMechanism;

  /**
   * Options for mergify
   *
   * @default - default options
   */
  readonly mergifyOptions?: MergifyOptions;

  /**
   * Automatically merge PRs that build successfully and have this label.
   *
   * To disable, set this value to an empty string.
   *
   * @default "auto-merge"
   */
  readonly mergifyAutoMergeLabel?: string;

  /**
   * Periodically submits a pull request for projen upgrades (executes `yarn
   * projen:upgrade`).
   *
   * This setting is a GitHub secret name which contains a GitHub Access Token
   * with `repo` and `workflow` permissions.
   *
   * This token is used to submit the upgrade pull request, which will likely
   * include workflow updates.
   *
   * To create a personal access token see https://github.com/settings/tokens
   *
   * @default - no automatic projen upgrade pull requests
   */
  readonly projenUpgradeSecret?: string;

  /**
   * Automatically merge projen upgrade PRs when build passes.
   * Applies the `mergifyAutoMergeLabel` to the PR if enabled.
   *
   * @default - "true" if mergify auto-merge is enabled (default)
   */
  readonly projenUpgradeAutoMerge?: boolean;

  /**
   * Customize the projenUpgrade schedule in cron expression.
   *
   @default [ "0 6 * * *" ]
   */
  readonly projenUpgradeSchedule?: string[];

  /**
   * Execute `projen` as the first step of the `build` task to synthesize
   * project files. This applies both to local builds and to CI builds.
   *
   * Disabling this feature is NOT RECOMMENDED and means that manual changes to
   * synthesized project files will be persisted.
   *
   * @default true
   */
  readonly projenDuringBuild?: boolean;

  /**
   * Defines an .npmignore file. Normally this is only needed for libraries that
   * are packaged as tarballs.
   *
   * @default true
   */
  readonly npmignoreEnabled?: boolean;

  /**
   * Additional entries to .npmignore
   */
  readonly npmignore?: string[];

  /**
   * Include a GitHub pull request template.
   *
   * @default true
   */
  readonly pullRequestTemplate?: boolean;

  /**
   * The contents of the pull request template.
   *
   * @default - default content
   */
  readonly pullRequestTemplateContents?: string;

  /**
   * Additional entries to .gitignore
   */
  readonly gitignore?: string[];

  /**
   * Setup jest unit tests
   * @default true
   */
  readonly jest?: boolean;

  /**
   * Jest options
   * @default - default options
   */
  readonly jestOptions?: JestOptions;

  /**
   * Generate (once) .projenrc.js (in JavaScript). Set to `false` in order to disable
   * .projenrc.js generation.
   *
   * @default true
   */
  readonly projenrcJs?: boolean;

  /**
   * Options for .projenrc.js
   * @default - default options
   */
  readonly projenrcJsOptions?: ProjenrcOptions;
}

/**
 * Automatic bump modes
 */
export enum AutoRelease {
  /**
   * Automatically bump & release a new version for every commit to "main"
   */
  EVERY_COMMIT,

  /**
   * Automatically bump & release a new version on a daily basis.
   */
  DAILY
}

/**
 * Node.js project
 */
export class NodeProject extends Project {
  /**
   * API for managing the node package.
   */
  public readonly package: NodePackage;

  /**
   * The .npmignore file.
   */
  public readonly npmignore?: IgnoreFile;

  /**
   * @deprecated use `package.allowLibraryDependencies`
   */
  public get allowLibraryDependencies(): boolean { return this.package.allowLibraryDependencies; }

  /**
   * @deprecated use `package.entrypoint`
   */
  public get entrypoint(): string { return this.package.entrypoint; }

  /**
   * Compiles the code. By default for node.js projects this task is empty.
   */
  public readonly compileTask: Task;

  /**
   * Tests the code.
   */
  public readonly testTask: Task;

  /**
   * Compiles the test code.
   */
  public readonly testCompileTask: Task;

  /**
   * The task responsible for a full release build. It spawns: compile + test + release + package
   */
  public readonly buildTask: Task;

  /**
   * Automatic PR merges.
   */
  public readonly autoMerge?: AutoMerge;


  /**
   * The PR build GitHub workflow. `undefined` if `buildWorkflow` is disabled.
   */
  public readonly buildWorkflow?: GithubWorkflow;
  public readonly buildWorkflowJobId?: string;

  /**
   * The release GitHub workflow. `undefined` if `releaseWorkflow` is disabled.
   * @deprecated use `release.workflow`
   */
  public readonly releaseWorkflow?: GithubWorkflow;

  /**
   * Package publisher. This will be `undefined` if the project does not have a
   * release workflow.
   *
   * @deprecated use `release.publisher`.
   */
  public readonly publisher?: Publisher;

  /**
   * Release management.
   */
  public readonly release?: Release;

  /**
   * Minimum node.js version required by this package.
   */
  public get minNodeVersion(): string | undefined { return this.package.minNodeVersion; }

  /**
   * Maximum node version required by this pacakge.
   */
  public get maxNodeVersion(): string | undefined { return this.package.maxNodeVersion; }

  private readonly nodeVersion?: string;

  /**
   * Indicates if workflows have anti-tamper checks.
   */
  public readonly antitamper: boolean;

  /**
   * @deprecated use `package.npmDistTag`
   */
  protected readonly npmDistTag: string;

  /**
   * @deprecated use `package.npmRegistry`
   */
  protected readonly npmRegistry: string;

  /**
   * The package manager to use.
   *
   * @deprecated use `package.packageManager`
   */
  public get packageManager(): NodePackageManager { return this.package.packageManager; }

  /**
   * The command to use to run scripts (e.g. `yarn run` or `npm run` depends on the package manager).
   */
  public readonly runScriptCommand: string;

  /**
   * The Jest configuration (if enabled)
   */
  public readonly jest?: Jest;

  /**
   * Determines how tasks are executed when invoked as npm scripts (yarn/npm run xyz).
   *
   * @deprecated use `package.npmTaskExecution`
   */
  public get npmTaskExecution(): NpmTaskExecution { return this.package.npmTaskExecution; }

  /**
   * The command to use in order to run the projen CLI.
   */
  public get projenCommand(): string { return this.package.projenCommand; }

  /**
   * @deprecated use `package.addField(x, y)`
   */
  public get manifest() {
    return this.package.manifest;
  }

  constructor(options: NodeProjectOptions) {
    super(options);

    this.package = new NodePackage(this, options);

    this.runScriptCommand = (() => {
      switch (this.packageManager) {
        case NodePackageManager.NPM: return 'npm run';
        case NodePackageManager.YARN: return 'yarn run';
        case NodePackageManager.PNPM: return 'pnpm run';
        default: throw new Error(`unexpected package manager ${this.packageManager}`);
      }
    })();

    this.nodeVersion = options.workflowNodeVersion ?? this.package.minNodeVersion;


    // add PATH for all tasks which includes the project's npm .bin list
    this.tasks.addEnvironment('PATH', '$(npx -c "node -e \\\"console.log(process.env.PATH)\\\"")');

    this.compileTask = this.addTask('compile', {
      description: 'Only compile',
      category: TaskCategory.BUILD,
    });

    this.testCompileTask = this.addTask('test:compile', {
      description: 'compiles the test code',
      category: TaskCategory.TEST,
    });

    this.testTask = this.addTask('test', {
      description: 'Run tests',
      category: TaskCategory.TEST,
    });

    this.testTask.spawn(this.testCompileTask);

    this.buildTask = this.addTask('build', {
      description: 'Full release build (test+compile)',
      category: TaskCategory.BUILD,
    });

    // first, execute projen as the first thing during build
    if (options.projenDuringBuild ?? true) {
      // skip for sub-projects (i.e. "parent" is defined) since synthing the
      // root project will include the subprojects.
      if (!this.parent) {
        this.buildTask.exec(this.projenCommand);
      }
    }

    this.addLicense(options);

    this.npmDistTag = this.package.npmDistTag;
    this.npmRegistry = this.package.npmRegistry;

    if (options.npmignoreEnabled ?? true) {
      this.npmignore = new IgnoreFile(this, '.npmignore');
    }

    this.addDefaultGitIgnore();

    if (options.gitignore?.length) {
      for (const i of options.gitignore) {
        this.gitignore.exclude(i);
      }
    }

    if (options.npmignore?.length) {
      if (!this.npmignore) {
        throw new Error('.npmignore is not defined for an APP project type. Add "npmIgnore: true" to override this');
      }

      for (const i of options.npmignore) {
        this.npmignore.exclude(i);
      }
    }


    this.setScript(PROJEN_SCRIPT, this.package.projenCommand);
    this.setScript('start', `${this.package.projenCommand} start`);

    this.npmignore?.exclude(`/${PROJEN_RC}`);
    this.npmignore?.exclude(`/${PROJEN_DIR}`);
    this.gitignore.include(`/${PROJEN_RC}`);

    const projen = options.projenDevDependency ?? true;
    if (projen) {
      const projenVersion = options.projenVersion ?? `^${PROJEN_VERSION}`;
      this.addDevDeps(`projen@${projenVersion}`);
    }

    if (!options.defaultReleaseBranch) {
      throw new Error('"defaultReleaseBranch" is temporarily a required option while we migrate its default value from "master" to "main"');
    }

    const buildEnabled = options.buildWorkflow ?? (this.parent ? false : true);
    const mutableBuilds = options.mutableBuild ?? true;

    // indicate if we have anti-tamper configured in our workflows. used by e.g. Jest
    // to decide if we can always run with --updateSnapshot
    this.antitamper = buildEnabled && (options.antitamper ?? true);

    // configure jest if enabled
    // must be before the build/release workflows
    if (options.jest ?? true) {
      this.jest = new Jest(this, options.jestOptions);
    }

    if (options.buildWorkflow ?? (this.parent ? false : true)) {
      const branch = '${{ github.event.pull_request.head.ref }}';
      const repo = '${{ github.event.pull_request.head.repo.full_name }}';
      const buildJobId = 'build';

      const updateRepo = new Array<any>();
      const gitDiffStepId = 'git_diff';
      const hasChangesCondName = 'has_changes';
      const hasChanges = `steps.${gitDiffStepId}.outputs.${hasChangesCondName}`;
      const repoFullName = 'github.event.pull_request.head.repo.full_name';

      // use "git diff --exit code" to check if there were changes in the repo
      // and create a step output that will be used in subsequent steps.
      updateRepo.push({
        name: 'Check for changes',
        id: gitDiffStepId,
        run: `git diff --exit-code || echo "::set-output name=${hasChangesCondName}::true"`,
      });

      // only if we had changes, commit them and push to the repo note that for
      // forks, this will fail (because the workflow doesn't have permissions.
      // this indicates to users that they need to update their branch manually.
      updateRepo.push({
        if: hasChanges,
        name: 'Commit and push changes (if changed)',
        run: `git add . && git commit -m "chore: self mutation" && git push origin HEAD:${branch}`,
      });

      // if we pushed changes, we need to manually update the status check so
      // that the PR will be green (we won't get here for forks with updates
      // because the push would have failed).
      updateRepo.push({
        if: hasChanges,
        name: 'Update status check (if changed)',
        run: [
          'gh api',
          '-X POST',
          `/repos/\${{ ${repoFullName} }}/check-runs`,
          `-F name="${buildJobId}"`,
          '-F head_sha="$(git rev-parse HEAD)"',
          '-F status="completed"',
          '-F conclusion="success"',
        ].join(' '),
        env: {
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
        },
      });

      const workflow = this.createBuildWorkflow('Build', {
        jobId: buildJobId,
        trigger: {
          pull_request: { },
        },
        permissions: {
          checks: JobPermission.WRITE,
          contents: JobPermission.WRITE,
        },
        checkoutWith: mutableBuilds ? {
          ref: branch,
          repository: repo,
        } : undefined,

        postSteps: updateRepo,

        antitamperDisabled: mutableBuilds, // <-- disable anti-tamper if build workflow is mutable
        image: options.workflowContainerImage,
        codeCov: options.codeCov ?? false,
        codeCovTokenSecret: options.codeCovTokenSecret,
      });

      this.buildWorkflow = workflow;
      this.buildWorkflowJobId = buildJobId;
    }

    if (options.releaseWorkflow ?? (this.parent ? false : true)) {
      this.addDevDeps(Version.STANDARD_VERSION);

      this.release = new Release(this, {
        task: this.buildTask,
        ...options,
        releaseWorkflowSetupSteps: [
          ...this.installWorkflowSteps,
          ...options.releaseWorkflowSetupSteps ?? [],
        ],
      });

      this.releaseWorkflow = this.release.workflow;
      this.publisher = this.release.publisher;

      if (options.releaseToNpm ?? false) {
        this.release.publisher.publishToNpm({
          distTag: this.package.npmDistTag,
          registry: this.package.npmRegistry,
          npmTokenSecret: this.package.npmTokenSecret,
        });
      }
    } else {
      // validate that no release options are selected if the release workflow is disabled.
      if (options.releaseToNpm) {
        throw new Error('"releaseToNpm" is not supported for APP projects');
      }

      if (options.releaseBranches) {
        throw new Error('"releaseBranches" is not supported for APP projects');
      }

      if (options.releaseEveryCommit) {
        throw new Error('"releaseEveryCommit" is not supported for APP projects');
      }

      if (options.releaseSchedule) {
        throw new Error('"releaseSchedule" is not supported for APP projects');
      }
    }

    if (this.github?.mergify) {
      this.autoMerge = new AutoMerge(this, {
        buildJob: this.buildWorkflowJobId,
        autoMergeLabel: options.mergifyAutoMergeLabel,
      });
      this.npmignore?.exclude('/.mergify.yml');
    }

    if (options.dependabot !== undefined && options.depsUpgrade) {
      throw new Error("'dependabot' cannot be configured together with 'depsUpgrade'");
    }

    const defaultDependenciesUpgrade = (options.dependabot ?? false) ? DependenciesUpgradeMechanism.dependabot()
      : DependenciesUpgradeMechanism.githubWorkflow();
    const dependenciesUpgrade = options.depsUpgrade ?? defaultDependenciesUpgrade;
    dependenciesUpgrade.bind(this);

    if (dependenciesUpgrade.ignoresProjen && this.package.packageName !== 'projen') {

      const projenAutoMerge = options.projenUpgradeAutoMerge ?? true;

      new UpgradeDependencies(this, {
        include: ['projen'],
        taskName: 'upgrade-projen',
        pullRequestTitle: 'upgrade projen',
        ignoreProjen: false,
        workflow: !!options.projenUpgradeSecret,
        workflowOptions: {
          schedule: UpgradeDependenciesSchedule.expressions(options.projenUpgradeSchedule ?? ['0 6 * * *']),
          secret: options.projenUpgradeSecret,
          labels: (projenAutoMerge && this.autoMerge?.autoMergeLabel)
            ? [this.autoMerge.autoMergeLabel]
            : [],
        },
      });
    }

    if (options.pullRequestTemplate ?? true) {
      this.github?.addPullRequestTemplate(...options.pullRequestTemplateContents ?? []);
    }

    const projenrcJs = options.projenrcJs ?? true;
    if (projenrcJs) {
      new Projenrc(this, options.projenrcJsOptions);
    }
  }

  public addBins(bins: Record<string, string>) {
    this.package.addBin(bins);
  }

  /**
   * Replaces the contents of an npm package.json script.
   *
   * @param name The script name
   * @param command The command to execute
   */
  public setScript(name: string, command: string) {
    this.package.setScript(name, command);
  }

  /**
   * Removes the npm script (always successful).
   * @param name The name of the script.
   */
  public removeScript(name: string) {
    this.package.removeScript(name);
  }

  /**
   * Indicates if a script by the name name is defined.
   * @param name The name of the script
   */
  public hasScript(name: string) {
    return this.package.hasScript(name);
  }

  /**
   * DEPRECATED
   * @deprecated use `project.compileTask.exec()`
   */
  public addCompileCommand(...commands: string[]) {
    for (const c of commands) {
      this.compileTask.exec(c);
    }
  }

  /**
   * DEPRECATED
   * @deprecated use `project.testTask.exec()`
   */
  public addTestCommand(...commands: string[]) {
    for (const c of commands) {
      this.testTask.exec(c);
    }
  }

  /**
   * DEPRECATED
   * @deprecated use `project.buildTask.exec()`
   */
  public addBuildCommand(...commands: string[]) {
    for (const c of commands) {
      this.buildTask.exec(c);
    }
  }

  /**
   * Directly set fields in `package.json`.
   * @param fields The fields to set
   */
  public addFields(fields: { [name: string]: any }) {
    for (const [name, value] of Object.entries(fields)) {
      this.package.addField(name, value);
    }
  }

  /**
   * Adds keywords to package.json (deduplicated)
   * @param keywords The keywords to add
   */
  public addKeywords(...keywords: string[]) {
    this.package.addKeywords(...keywords);
  }

  public get installWorkflowSteps(): any[] {
    const install = new Array();
    if (this.nodeVersion) {
      install.push({
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v1',
        with: { 'node-version': this.nodeVersion },
      });
    }

    install.push({
      name: 'Install dependencies',
      run: this.package.installCommand,
    });
    return install;
  }

  /**
   * Defines normal dependencies.
   *
   * @param deps Names modules to install. By default, the the dependency will
   * be installed in the next `npx projen` run and the version will be recorded
   * in your `package.json` file. You can upgrade manually or using `yarn
   * add/upgrade`. If you wish to specify a version range use this syntax:
   * `module@^7`.
   */
  public addDeps(...deps: string[]) {
    return this.package.addDeps(...deps);
  }

  /**
   * Defines development/test dependencies.
   *
   * @param deps Names modules to install. By default, the the dependency will
   * be installed in the next `npx projen` run and the version will be recorded
   * in your `package.json` file. You can upgrade manually or using `yarn
   * add/upgrade`. If you wish to specify a version range use this syntax:
   * `module@^7`.
   */
  public addDevDeps(...deps: string[]) {
    return this.package.addDevDeps(...deps);
  }

  /**
   * Defines peer dependencies.
   *
   * When adding peer dependencies, a devDependency will also be added on the
   * pinned version of the declared peer. This will ensure that you are testing
   * your code against the minimum version required from your consumers.
   *
   * @param deps Names modules to install. By default, the the dependency will
   * be installed in the next `npx projen` run and the version will be recorded
   * in your `package.json` file. You can upgrade manually or using `yarn
   * add/upgrade`. If you wish to specify a version range use this syntax:
   * `module@^7`.
   */
  public addPeerDeps(...deps: string[]) {
    return this.package.addPeerDeps(...deps);
  }

  /**
   * Defines bundled dependencies.
   *
   * Bundled dependencies will be added as normal dependencies as well as to the
   * `bundledDependencies` section of your `package.json`.
   *
   * @param deps Names modules to install. By default, the the dependency will
   * be installed in the next `npx projen` run and the version will be recorded
   * in your `package.json` file. You can upgrade manually or using `yarn
   * add/upgrade`. If you wish to specify a version range use this syntax:
   * `module@^7`.
   */
  public addBundledDeps(...deps: string[]) {
    return this.package.addBundledDeps(...deps);
  }

  public addPackageIgnore(pattern: string) {
    this.npmignore?.addPatterns(pattern);
  }

  private addLicense(options: NodeProjectOptions) {
    if (this.package.license) {
      new License(this, {
        spdx: this.package.license,
        copyrightOwner: options.copyrightOwner ?? options.authorName,
        copyrightPeriod: options.copyrightPeriod,
      });
    }
  }

  private addDefaultGitIgnore() {
    this.gitignore.exclude(
      '# Logs',
      'logs',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*',

      '# Diagnostic reports (https://nodejs.org/api/report.html)',
      'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',

      '# Runtime data',
      'pids',
      '*.pid',
      '*.seed',
      '*.pid.lock',

      '# Directory for instrumented libs generated by jscoverage/JSCover',
      'lib-cov',

      '# Coverage directory used by tools like istanbul',
      'coverage',
      '*.lcov',

      '# nyc test coverage',
      '.nyc_output',

      '# Compiled binary addons (https://nodejs.org/api/addons.html)',
      'build/Release',

      '# Dependency directories',
      'node_modules/',
      'jspm_packages/',

      '# TypeScript cache',
      '*.tsbuildinfo',


      '# Optional eslint cache',
      '.eslintcache',

      '# Output of \'npm pack\'',
      '*.tgz',

      '# Yarn Integrity file',
      '.yarn-integrity',

      '# parcel-bundler cache (https://parceljs.org/)',
      '.cache',
    );
  }

  private createBuildWorkflow(name: string, options: NodeBuildWorkflowOptions): GithubWorkflow {
    const buildJobId = options.jobId;

    const github = this.github;
    if (!github) { throw new Error('no github support'); }

    const workflow = github.addWorkflow(name);

    if (options.trigger) {
      if (options.trigger.issue_comment) {
        throw new Error('"issue_comment" should not be used as a trigger due to a security issue');
      }

      workflow.on(options.trigger);
    }

    workflow.on({
      workflowDispatch: {}, // allow manual triggering
    });

    const condition = options.condition ? { if: options.condition } : {};
    const preBuildSteps = options.preBuildSteps ?? [];
    const preCheckoutSteps = options.preCheckoutSteps ?? [];
    const checkoutWith = options.checkoutWith ? { with: options.checkoutWith } : {};
    const postSteps = options.postSteps ?? [];

    const antitamperSteps = (options.antitamperDisabled || !this.antitamper) ? [] : [{
      name: 'Anti-tamper check',
      run: 'git diff --ignore-space-at-eol --exit-code',
    }];

    const job: Mutable<workflows.Job> = {
      runsOn: 'ubuntu-latest',
      env: {
        CI: 'true', // will cause `NodeProject` to execute `yarn install` with `--frozen-lockfile`
        ...options.env ?? {},
      },
      permissions: options.permissions,
      ...condition,
      steps: [
        ...preCheckoutSteps,

        // check out sources.
        {
          name: 'Checkout',
          uses: 'actions/checkout@v2',
          ...checkoutWith,
        },

        // install dependencies
        ...this.installWorkflowSteps,

        // perform an anti-tamper check immediately after we run projen.
        ...antitamperSteps,

        // sets git identity so we can push later
        {
          name: 'Set git identity',
          run: [
            'git config user.name "Automation"',
            'git config user.email "github-actions@github.com"',
          ].join('\n'),
        },

        // if there are changes, creates a bump commit

        ...preBuildSteps,

        // build (compile + test)
        {
          name: 'Build',
          run: this.runTaskCommand(this.buildTask),
        },

        // run codecov if enabled or a secret token name is passed in
        // AND jest must be configured
        ...(options.codeCov || options.codeCovTokenSecret) && this.jest?.config ? [{
          name: 'Upload coverage to Codecov',
          uses: 'codecov/codecov-action@v1',
          with: options.codeCovTokenSecret ? {
            token: `\${{ secrets.${options.codeCovTokenSecret} }}`,
            directory: this.jest.config.coverageDirectory,
          } : {
            directory: this.jest.config.coverageDirectory,
          },
        }] : [],

        ...postSteps,

        // anti-tamper check (fails if there were changes to committed files)
        // this will identify any non-committed files generated during build (e.g. test snapshots)
        ...antitamperSteps,
      ],
    };

    if (options.image) {
      job.container = { image: options.image };
    }

    workflow.addJobs({ [buildJobId]: job });

    return workflow;
  }

  /**
 * Returns the shell command to execute in order to run a task. If
 * npmTaskExecution is set to PROJEN, the command will be `npx projen TASK`.
 * If it is set to SHELL, the command will be `yarn run TASK` (or `npm run
 * TASK`).
 *
 * @param task The task for which the command is required
 */
  public runTaskCommand(task: Task) {
    switch (this.package.npmTaskExecution) {
      case NpmTaskExecution.PROJEN: return `${this.package.projenCommand} ${task.name}`;
      case NpmTaskExecution.SHELL: return `${this.runScriptCommand} ${task.name}`;
      default:
        throw new Error(`invalid npmTaskExecution mode: ${this.package.npmTaskExecution}`);
    }
  }
}

interface NodeBuildWorkflowOptions {
  /**
   * The primary job id.
   */
  readonly jobId: string;

  /**
   * @default - default image
   */
  readonly image?: string;

  /**
   * Adds an "if" condition to the workflow.
   */
  readonly condition?: any;

  /**
   * What should trigger the workflow?
   *
   * @default - by default workflows can only be triggered by manually.
   */
  readonly trigger?: { [event: string]: any };

  /**
   * Bump a new version for this build.
   * @default false
   */
  // readonly bump?: boolean;

  /**
   * Run codecoverage step
   * Send to https://codecov.io/
   * @default false
   */
  readonly codeCov?: boolean;

  /**
   * The secret name for the https://codecov.io/ token
   */
  readonly codeCovTokenSecret?: string;

  readonly preBuildSteps?: any[];
  readonly preCheckoutSteps?: any[];
  readonly postSteps?: any[];
  readonly checkoutWith?: { [key: string]: any };

  /**
   * Disables anti-tamper checks in the workflow.
   */
  readonly antitamperDisabled?: boolean;

  /**
   * Workflow environment variables.
   * @default {}
   */
  readonly env?: { [name: string]: string };

  /**
   * Permissions for the build job.
   */
  readonly permissions: workflows.JobPermissions;
}

export interface NodeWorkflowSteps {
  readonly antitamper: any[];
  readonly install: any[];
}

/**
 * Dependencies upgrade mechanism.
 */
export class DependenciesUpgradeMechanism {

  /**
   * Disable.
   */
  public static readonly NONE = new DependenciesUpgradeMechanism((_: NodeProject) => ({}), true);

  /**
   * Upgrade via dependabot.
   */
  public static dependabot(options: DependabotOptions = {}) {
    return new DependenciesUpgradeMechanism((project: NodeProject) => {
      project.github?.addDependabot(options);
    }, options.ignoreProjen);
  }

  /**
   * Upgrade via a custom github workflow.
   */
  public static githubWorkflow(options: UpgradeDependenciesOptions = {}) {
    return new DependenciesUpgradeMechanism((project: NodeProject) => {
      new UpgradeDependencies(project, options);
    }, options.ignoreProjen);
  }

  private constructor(
    private readonly binder: (project: NodeProject) => void,
    private readonly _ignoresProjen?: boolean) {}

  public get ignoresProjen(): boolean {
    // we ignore projen by default because it requires 'workflow' permissions to run.
    // nor depenedabot nor the default github token has those permissions.
    return this._ignoresProjen ?? true;
  }

  public bind(project: NodeProject) {
    this.binder(project);
  }
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] };
