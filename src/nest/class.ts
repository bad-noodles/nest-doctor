import { ClassDeclaration, Directory } from "ts-morph"
import { Module } from "./module"

export class Class {
  constructor(private classDeclaration: ClassDeclaration) { }
  get name(): string {
    return this.classDeclaration.getNameNode()?.getText() || ''
  }
  get type(): string {
    return this.classDeclaration.getType().getText()
  }
  get filePath(): string {
    return this.classDeclaration.getSourceFile().getFilePath()
  }
  isDefaultExport(): boolean {
    return !!this.classDeclaration.getDefaultKeyword()
  }
  getDependencyOfType(dep: string) {
    return this.classDeclaration.getInstanceProperties().find(p => p.getType().getText().endsWith(dep))
  }
  private lookForModule(dir: Directory): Module | undefined {
    const mod = dir.getSourceFiles().find((sf) => sf.getFilePath().endsWith("module.ts"))

    if (mod) {
      return new Module(mod)
    }
  }
  getModule(): Module | undefined {
    let dir: Directory | undefined = this.classDeclaration.getSourceFile().getDirectory()

    while (dir) {
      let mod = this.lookForModule(dir)

      if (mod) {
        return mod
      }

      dir = dir.getParent()
    }
  }
}
