#!/usr/bin/env node
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/runner.ts
import { spawn } from "child_process";
import { stderr, stdout } from "process";

// src/options.ts
import { argv } from "process";
var options = {
  auto: false
};
argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
  switch (val) {
    case "--auto":
      options.auto = true;
      break;
  }
});

// src/nest/project.ts
import { Project as TSProject } from "ts-morph";

// src/nest/module.ts
import chalk from "chalk";
import { diffChars } from "diff";
import { SyntaxKind } from "ts-morph";
var Module = class {
  constructor(sourceFile) {
    this.sourceFile = sourceFile;
    this.original = sourceFile.getFullText();
  }
  get type() {
    var _a;
    return ((_a = this.getClassDefinition()) == null ? void 0 : _a.getType().getText()) || "";
  }
  get filePath() {
    return this.sourceFile.getFilePath();
  }
  getClassDefinition() {
    return this.sourceFile.getClasses().find((c) => c.getDecorator("Module"));
  }
  getModuleDefiniton() {
    var _a, _b;
    return (_b = (_a = this.getClassDefinition()) == null ? void 0 : _a.getDecorator("Module")) == null ? void 0 : _b.getArguments()[0].asKind(SyntaxKind.ObjectLiteralExpression);
  }
  getProviderArray() {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.getModuleDefiniton()) == null ? void 0 : _a.getProperty("providers")) == null ? void 0 : _b.getLastChild()) == null ? void 0 : _c.asKind(SyntaxKind.ArrayLiteralExpression);
  }
  getImportsArray() {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.getModuleDefiniton()) == null ? void 0 : _a.getProperty("imports")) == null ? void 0 : _b.getLastChild()) == null ? void 0 : _c.asKind(SyntaxKind.ArrayLiteralExpression);
  }
  getOrCreateImportsArray() {
    var _a, _b;
    let ia = this.getImportsArray();
    if (ia) {
      return ia;
    }
    const ass = (_a = this.getModuleDefiniton()) == null ? void 0 : _a.addPropertyAssignment({
      name: "imports",
      initializer: "[]"
    });
    ia = (_b = ass == null ? void 0 : ass.getLastChild()) == null ? void 0 : _b.asKind(SyntaxKind.ArrayLiteralExpression);
    if (!ia) {
      throw new Error("Could not create imports array");
    }
    return ia;
  }
  getClass() {
    const cd = this.getClassDefinition();
    if (cd === void 0)
      return cd;
    return new Class(cd);
  }
  hasProvider(c) {
    const providerArray = this.getProviderArray();
    if (!providerArray) {
      return false;
    }
    return !!providerArray.getElements().find((p) => p.getType().getText() === c.type);
  }
  save() {
    this.sourceFile.saveSync();
  }
  addProvider(provider) {
    const isDefault = provider.isDefaultExport();
    const importPath = `./${this.sourceFile.getRelativePathTo(provider.filePath).replace(/\.ts$/, "")}`;
    const providerArray = this.getProviderArray();
    if (!providerArray) {
      throw new Error("Missing provider array");
    }
    this.sourceFile.addImportDeclaration({
      moduleSpecifier: importPath,
      namedImports: isDefault ? [] : [provider.name],
      defaultImport: isDefault ? provider.name : void 0
    });
    providerArray.addElement(provider.name);
  }
  addImport(mod) {
    const modClass = mod.getClass();
    if (!modClass) {
      return new Error("Could not parse module, failed to get class");
    }
    const isDefault = modClass.isDefaultExport();
    const importPath = this.sourceFile.getRelativePathTo(modClass.filePath).replace(/\.ts$/, "");
    const importsArray = this.getOrCreateImportsArray();
    this.sourceFile.addImportDeclaration({
      moduleSpecifier: importPath,
      namedImports: isDefault ? [] : [modClass.name],
      defaultImport: isDefault ? modClass.name : void 0
    });
    importsArray.addElement(modClass.name);
  }
  diff() {
    const diff = diffChars(this.original, this.sourceFile.getFullText());
    return diff.map(
      (part) => (
        // green for additions, red for deletions
        part.added ? chalk.bgGreen(part.value) : part.removed ? chalk.bgRed(part.value) : part.value
      )
    ).join("");
  }
};

// src/nest/class.ts
var Class = class {
  constructor(classDeclaration) {
    this.classDeclaration = classDeclaration;
  }
  get name() {
    var _a;
    return ((_a = this.classDeclaration.getNameNode()) == null ? void 0 : _a.getText()) || "";
  }
  get type() {
    return this.classDeclaration.getType().getText();
  }
  get filePath() {
    return this.classDeclaration.getSourceFile().getFilePath();
  }
  isDefaultExport() {
    return !!this.classDeclaration.getDefaultKeyword();
  }
  getDependencyOfType(dep) {
    return this.classDeclaration.getInstanceProperties().find((p) => p.getType().getText().endsWith(dep));
  }
  lookForModule(dir) {
    const mod = dir.getSourceFiles().find((sf) => sf.getFilePath().endsWith("module.ts"));
    if (mod) {
      return new Module(mod);
    }
  }
  getModule() {
    let dir = this.classDeclaration.getSourceFile().getDirectory();
    while (dir) {
      let mod = this.lookForModule(dir);
      if (mod) {
        return mod;
      }
      dir = dir.getParent();
    }
  }
};

// src/nest/project.ts
var Project = class {
  constructor(path) {
    this.modules = [];
    this.classes = [];
    this.project = new TSProject({
      tsConfigFilePath: path
    });
    this.parseProject();
  }
  parseProject() {
    this.project.getSourceFiles().forEach((sourceFile) => {
      if (!sourceFile.getBaseName().endsWith(".module.ts")) {
        this.modules.push(new Module(sourceFile));
      }
      this.classes.push(...sourceFile.getClasses().map((c) => new Class(c)));
    });
  }
  filterClass(predicate) {
    return this.classes.filter(predicate);
  }
  findClass(predicate) {
    return this.classes.find(predicate);
  }
};

// src/handlers/interface.ts
var Handler = class {
  constructor(cwd2, msg) {
    this.cwd = cwd2;
    this.msg = msg;
    this.project = new Project(`${cwd2}/tsconfig.json`);
  }
  static shouldHandle(_) {
    return false;
  }
};

// src/handlers/missing-dependency.ts
import chalk2 from "chalk";
import inquirer from "inquirer";
var MissingDependency = class extends Handler {
  static shouldHandle(msg) {
    return msg.includes("Nest can't resolve dependencies");
  }
  handle() {
    const target = this.target;
    const possibleTargets = this.project.filterClass((c) => c.name === target);
    possibleTargets.find(this.handleTarget.bind(this));
  }
  get target() {
    var _a;
    const target = (_a = this.msg.match(/Nest can't resolve dependencies of the (\w*)/)) == null ? void 0 : _a[1];
    if (target === void 0) {
      throw new Error("Could not parse target from error message");
    }
    return target;
  }
  get module() {
    var _a;
    const mod = (_a = this.msg.match(/available in the (\w*) context/)) == null ? void 0 : _a[1];
    if (mod === void 0) {
      throw new Error("Could not parse module from error message");
    }
    return mod;
  }
  get dependency() {
    var _a;
    const dependency = (_a = this.msg.match(/Please make sure that the argument (\w*)/)) == null ? void 0 : _a[1];
    if (dependency === void 0) {
      throw new Error("Could not parse dependency from error message");
    }
    return dependency;
  }
  solveSameModule(mod, dependency) {
    return __async(this, null, function* () {
      mod.addProvider(dependency);
      process.stdout.write(chalk2.bold("\n\u{1FA7A} It seems like you just need to map the dependency on your module\n\n"));
      process.stdout.write(`\u{1F4C4} ${mod.filePath}
`);
      process.stdout.write(mod.diff());
      if (options.auto) {
        mod.save();
        return true;
      }
      const response = yield inquirer.prompt([{
        name: "shouldApply",
        type: "confirm",
        message: "\u{1F4BE} Apply?"
      }]);
      if (response.shouldApply) {
        mod.save();
      }
      return true;
    });
  }
  solveDifferentModule(mod, dependency) {
    return __async(this, null, function* () {
      const dependencyMod = dependency.getModule();
      if (!dependencyMod) {
        return false;
      }
      mod.addImport(dependencyMod);
      process.stdout.write(chalk2.bold("\n\u{1FA7A} It seems like you just need to import another module that provides the dependency\n\n"));
      process.stdout.write(`\u{1F4C4} ${mod.filePath}
`);
      process.stdout.write(mod.diff());
      if (options.auto) {
        mod.save();
        return true;
      }
      const response = yield inquirer.prompt([{
        name: "shouldApply",
        type: "confirm",
        message: "\u{1F4BE} Apply?"
      }]);
      if (response.shouldApply) {
        mod.save();
      }
      return true;
    });
  }
  handleTarget(target) {
    return __async(this, null, function* () {
      const depName = this.dependency;
      const dep = target.getDependencyOfType(depName);
      if (dep === void 0)
        return false;
      const t = dep.getType().getText();
      const depClass = this.project.findClass((c) => c.type === t);
      const depMod = depClass == null ? void 0 : depClass.getModule();
      const mod = target.getModule();
      if (depClass === void 0 || depMod === void 0 || mod === void 0) {
        return false;
      }
      if (mod.type == depMod.type && !depMod.hasProvider(depClass)) {
        return this.solveSameModule(mod, depClass);
      }
      return this.solveDifferentModule(mod, depClass);
    });
  }
};

// src/ts.ts
var handlers = [
  MissingDependency
];
function fix(cwd2, msg) {
  const Handler2 = handlers.find((h) => h.shouldHandle(msg));
  if (!Handler2) {
    return;
  }
  const handler = new Handler2(cwd2, msg);
  handler.handle();
}

// src/runner.ts
var cwd = ".";
var start = spawn("nest", ["start", "--watch"], { cwd });
start.stdout.pipe(stdout);
start.stderr.pipe(stderr);
start.stderr.on("data", (r) => {
  const data = r.toString();
  if (!data.startsWith("Error"))
    return;
  fix(cwd, data);
});
start.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
