import { argv } from 'node:process';

export const options = {
  auto: false,
  reckless: false,
}

argv.forEach((val) => {
  switch (val) {
    case "--auto":
      options.auto = true
      break
    case "--reckless":
      options.auto = true
      options.reckless = true
      break
  }
});

