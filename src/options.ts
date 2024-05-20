import { argv } from 'node:process';

export const options = {
  auto: false
}

argv.forEach((val) => {
  switch (val) {
    case "--auto":
      options.auto = true
      break
  }
});

