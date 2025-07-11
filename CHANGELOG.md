# @labdigital/enviconf

## 1.0.0

### Major Changes

- bfbe638: Remove support for decorators (`@enviprop`)

### Patch Changes

- f8fb325: Add the `disableUnset` flag to load, to disable unset functionality globally

## 0.7.0

### Minor Changes

- 0b1ab9b: add new decorator-less config style using `config()` function

## 0.6.0

### Minor Changes

- 875430c: Add support to use without decorators by implementing a static method `configure()` which calls `registerProperty()` with the options instead

## 0.5.0

### Minor Changes

- 1917c73: Remove support for loading .env files. This should be done separately

## 0.4.1

### Patch Changes

- 6fcbab0: Implement the unset flag to delete environment variable after reading

## 0.4.0

### Minor Changes

- 477d956: Add support for setting optional env prefix

## 0.3.0

### Minor Changes

- effd012: Add optional options to .load() to specifiy path to load .env from

## 0.2.1

### Patch Changes

- 97f35ef: Add .boolean and .object to envprop

## 0.2.0

### Minor Changes

- 4b22b0a: Simplify API by exporting type decorators

### Patch Changes

- ff3eccf: Make values without default value by default required

## 0.1.2

### Patch Changes

- 9006dee: Add dist/ path explicitly

## 0.1.1

### Patch Changes

- 94ef6bf: Implement envSeparator support
- fd390cc: Fix distribution

## 0.1.0

### Minor Changes

- 79091f7: Initial release
