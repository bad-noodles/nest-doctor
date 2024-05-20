import { Project as TSProject } from "ts-morph"
import { Class } from "./class"
import { Module } from "./module"

export class Project {
  private project: TSProject
  private modules: Module[] = []
  private classes: Class[] = []

  constructor(path: string) {
    this.project = new TSProject({
      tsConfigFilePath: path,
    })

    this.parseProject()
  }

  private parseProject() {
    this.project.getSourceFiles().forEach(sourceFile => {
      if (!sourceFile.getBaseName().endsWith('.module.ts')) {
        this.modules.push(new Module(sourceFile))
      }

      this.classes.push(...sourceFile.getClasses().map(c => new Class(c)))
    })
  }

  filterClass(predicate: (c: Class, i: Number) => boolean): Class[] {
    return this.classes.filter(predicate)
  }

  findClass(predicate: (c: Class, i: Number) => boolean): Class | undefined {
    return this.classes.find(predicate)
  }

}


