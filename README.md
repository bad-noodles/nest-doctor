# Nest Doctor

A companion to improve developer experience when using [NestJS](https://nestjs.com/).
It aims to help maintain the modules/dependency management containers by
reading the cryptic error messages that nest provides, matching it
against your code, and providing a suggestion on how to fix it
(or at least extra information to make it easier to debug).

## Demo

![nest-doctor](https://github.com/bad-noodles/nest-doctor/blob/main/nest-doctor.gif)

## Instalation

```sh
npm install -D nest-doctor
```

## Usage

It works as a wrapper around the nest CLI watcher that you
would normally use for development.
You can run it directly on your project's folder or replace
the `start:dev` script on `package.json`, such as:

```json
{
  //...
  "scripts": {
    //...
    "start:dev": "nest-doctor",
    //...
  },
  //...
}
```

You can also enable auto-applying the suggested fix with the `--auto` flag.
So your nest-doctor usage would be:

```bash
nest-doctor --auto
```

The --auto flag will not break the boundaries between modules, meaning it will
not export a provider from a module without checking with the developer first.
To overwrite that behaviour, use the --reckless flag instead.

## Cases

There are, currently, two cases the doctor takes care of. More will come in the future.

### Missing a dependency in the same module

When you create a new provider but forget to add it to your module's provider array
before requiring it somewhere else within the same module.

### Missing a dependency from a different module

When you start depending on a provider that is in another module,
but the module that provides it is not imported on your current module.

## Caveats

The doctor is still in alpha stage and breaking changes are expected.

It works by doing static analysis of your code, so it is only aware of
dependencies that can be solved by reading the code, not executing it.
Dependencies that are dynamically added (ex.: conditionally added after reading
a flag from a config file) are not able to be resolved and the doctor
will simply suggest to add it statically.

The static analysis at this moment is still pretty basic, so it expects
that your providers and imports are mapped with array literals.
This means that you cannot declare the array in a variable and then use it
on your module definition.

It also does not follow spread operators or other form of array merges,
so it might just suggest you to add the dependency even if it already exists
or just fail to parse your module definition.

Most of these limitations are expected to be handled as the project matures,
but some of them are just limitations of static analysis and will probably remain.
