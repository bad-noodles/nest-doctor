import { options } from '../options'
import { Handler } from "./interface";
import chalk from "chalk";
import inquirer from "inquirer";
import { Class } from "../nest/class";
import { Module } from "../nest/module";

export class MissingDependency extends Handler {
  static shouldHandle(msg: string): boolean {
    return msg.includes('Nest can\'t resolve dependencies')
  }
  handle(): void {
    const target = this.target
    const possibleTargets = this.project.filterClass((c) => c.name === target)

    possibleTargets.find(this.handleTarget.bind(this))
  }
  get target(): string {
    const target = this.msg.match(/Nest can't resolve dependencies of the (\w*)/)?.[1]

    if (target === undefined) {
      throw new Error('Could not parse target from error message')
    }
    return target
  }
  get module(): string {
    const mod = this.msg.match(/available in the (\w*) context/)?.[1]

    if (mod === undefined) {
      throw new Error('Could not parse module from error message')
    }
    return mod
  }
  get dependency(): string {
    const dependency = this.msg.match(/Please make sure that the argument (\w*)/)?.[1]

    if (dependency === undefined) {
      throw new Error('Could not parse dependency from error message')
    }
    return dependency
  }

  private async solveSameModule(mod: Module, dependency: Class): Promise<boolean> {
    mod.addProvider(dependency)

    process.stdout.write(chalk.bold("\n🩺 It seems like you just need to map the dependency on your module\n\n"))
    process.stdout.write(`📄 ${mod.filePath}\n`)
    process.stdout.write(mod.diff())

    if (options.auto) {
      mod.save()
      return true
    }

    const response = await inquirer.prompt([{
      name: 'shouldApply',
      type: 'confirm',
      message: "💾 Apply?"
    }])

    if (response.shouldApply) {
      mod.save()
    }
    return true

  }

  private async solveDifferentModule(mod: Module, dependency: Class): Promise<boolean> {
    const dependencyMod = dependency.getModule()

    if (!dependencyMod) {
      return false
    }

    // if (!dependencyMod.hasProvider(dependency)) {
    //   dependencyMod.addProvider(dependency)
    // }

    mod.addImport(dependencyMod)

    process.stdout.write(chalk.bold("\n🩺 It seems like you just need to import another module that provides the dependency\n\n"))
    process.stdout.write(`📄 ${mod.filePath}\n`)
    process.stdout.write(mod.diff())

    if (options.auto) {
      mod.save()
      return true
    }

    const response = await inquirer.prompt([{
      name: 'shouldApply',
      type: 'confirm',
      message: "💾 Apply?"
    }])

    if (response.shouldApply) {
      mod.save()
    }

    return true
  }

  private async handleTarget(target: Class): Promise<boolean> {
    const depName = this.dependency
    const dep = target.getDependencyOfType(depName)
    if (dep === undefined) return false
    const t = dep.getType().getText()
    const depClass = this.project.findClass(c => c.type === t)
    const depMod = depClass?.getModule()
    const mod = target.getModule()

    if (depClass === undefined || depMod === undefined || mod === undefined) {
      //todo something
      return false
    }

    if (mod.type == depMod.type && !depMod.hasProvider(depClass)) {
      return this.solveSameModule(mod, depClass)
    }

    return this.solveDifferentModule(mod, depClass)
  }

}

