import chalk from "chalk"
import { diffChars } from "diff"
import { SourceFile, ObjectLiteralExpression, SyntaxKind, ArrayLiteralExpression } from "ts-morph"
import { Class } from "./class"

export class Module {
  private original: string
  constructor(private sourceFile: SourceFile) {
    this.original = sourceFile.getFullText()
  }


  get type(): string {
    return this.getClassDefinition()?.getType().getText() || ''
  }
  get filePath(): string {
    return this.sourceFile.getFilePath()
  }

  private getClassDefinition() {
    return this.sourceFile.getClasses().find(c => c.getDecorator('Module'))
  }

  private getModuleDefiniton(): ObjectLiteralExpression | undefined {
    return this.getClassDefinition()?.getDecorator('Module')?.getArguments()[0].asKind(SyntaxKind.ObjectLiteralExpression)
  }

  private getProviderArray(): ArrayLiteralExpression | undefined {
    return this.getModuleDefiniton()?.getProperty('providers')?.getLastChild()?.asKind(SyntaxKind.ArrayLiteralExpression)
  }

  private getImportsArray(): ArrayLiteralExpression | undefined {
    return this.getModuleDefiniton()?.getProperty('imports')?.getLastChild()?.asKind(SyntaxKind.ArrayLiteralExpression)
  }

  private getOrCreateImportsArray(): ArrayLiteralExpression {
    let ia = this.getImportsArray()


    if (ia) {
      return ia
    }

    const ass = this.getModuleDefiniton()?.addPropertyAssignment({
      name: 'imports',
      initializer: '[]',
    })
    ia = ass?.getLastChild()?.asKind(SyntaxKind.ArrayLiteralExpression)

    if (!ia) {
      throw new Error('Could not create imports array')
    }

    return ia
  }

  getClass(): Class | undefined {
    const cd = this.getClassDefinition()

    if (cd === undefined) return cd

    return new Class(cd)
  }

  hasProvider(c: Class): boolean {
    const providerArray = this.getProviderArray()

    if (!providerArray) {
      return false
    }

    return !!providerArray.getElements().find((p) => p.getType().getText() === c.type)
  }


  save() {
    this.sourceFile.saveSync()
  }


  addProvider(provider: Class) {
    const isDefault = provider.isDefaultExport()
    const importPath = `./${this.sourceFile.getRelativePathTo(provider.filePath).replace(/\.ts$/, '')}`
    const providerArray = this.getProviderArray()

    if (!providerArray) {
      throw new Error('Missing provider array')
    }

    this.sourceFile.addImportDeclaration({
      moduleSpecifier: importPath,
      namedImports: isDefault ? [] : [provider.name],
      defaultImport: isDefault ? provider.name : undefined,
    })

    providerArray.addElement(provider.name)
  }

  addImport(mod: Module) {
    const modClass = mod.getClass()

    if (!modClass) {
      return new Error('Could not parse module, failed to get class')
    }

    const isDefault = modClass.isDefaultExport()
    const importPath = this.sourceFile.getRelativePathTo(modClass.filePath).replace(/\.ts$/, '')
    const importsArray = this.getOrCreateImportsArray()

    this.sourceFile.addImportDeclaration({
      moduleSpecifier: importPath,
      namedImports: isDefault ? [] : [modClass.name],
      defaultImport: isDefault ? modClass.name : undefined,
    })

    importsArray.addElement(modClass.name)

  }

  diff(): string {
    const diff = diffChars(this.original, this.sourceFile.getFullText())
    return diff.map((part) =>
      // green for additions, red for deletions
      part.added ? chalk.bgGreen(part.value) :
        part.removed ? chalk.bgRed(part.value) :
          part.value
    ).join('');
  }

}
