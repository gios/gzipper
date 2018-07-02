# gzipper
Simple CLI for gzipping your js and css files.

## How to use:
### Install globally the package.

``` npm i gzipper -g ```

or locally to devDependencies

``` npm i gzipper ```

### Run script from global scope or from your package.json as a script;
Globally usage.

``` gzipper <path> args```

Locally usage.
* add to scripts property in your package.json

```
  "scripts": {
    ...
    "gzipper": "gzipper"
  }
```

* use gzipper with your build commands (e.g. Angular CLI)
```
  "scripts": {
    "build": "ng build && gzipper ./dist"
  }
```

### Args
* ```--log``` - enable logging for each file

### Roadmap
- [x] First work version
- [ ] Unit tests
- [x] Additional arguments for CLI
- [ ] Your porposal for improvement

### Contribution
I appreciate every contribution, just fork the repository and send the pull request with your changes.

### Requirments
* Node.js >= 8