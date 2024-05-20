import { Project } from "../nest/project";

export abstract class Handler {
  protected readonly project: Project
  constructor(protected readonly cwd: string, protected readonly msg: string) {
    this.project = new Project(`${cwd}/tsconfig.json`)
  }
  static shouldHandle(_: string): boolean {
    return false;
  }
  abstract handle(msg: string): void;
}
