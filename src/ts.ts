import { MissingDependency } from "./handlers/missing-dependency";



const handlers = [
  MissingDependency,
]


export function fix(cwd: string, msg: string) {
  const Handler = handlers.find(h => h.shouldHandle(msg))

  if (!Handler) {
    return
  }

  const handler = new Handler(cwd, msg);

  handler.handle()
}

