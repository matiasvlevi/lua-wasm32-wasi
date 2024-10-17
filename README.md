# Lua + wasm32-wasi


### Dependencies

Install [wasi-sdk-24](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-24) and set the `WASI_SDK_PATH` variable.

you can do:

```sh
make WASI_SDK_PATH=/my/path/to/wasi-sdk-24
```

or directly change it in the makefile.

<br/>

### Build

Simple lua embedded in a wasm browser environement

```sh
make
```