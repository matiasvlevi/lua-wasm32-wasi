#ifndef __LUA_ATTRIBUTES__
#define __LUA_ATTRIBUTES__

/**
 * Use this to declare an imported function
 *
 * These are defined in the environement (eg: Javascript in the browser) and declared/called in the application
 *
 */
#define _wasm_import(module, name) __attribute__((import_module(module), import_name(name)))

/**
 * Use this to declare exported function.
 *
 * These can be called from the environement (eg: Javascript in the browser)
 */
#define _wasm_export(name)         __attribute__((export_name(name))) 

#endif /* __LUA_ATTRIBUTES__ */