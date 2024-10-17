const lua_bindings = {
    /*
      Add environement specific bindings here
     'this' is bound to the Lua prototype
    */
    alert(message_ptr) {
        // Read the message string from wasm memory
        const message = get_cstr(this.view, message_ptr);

        // Call environement specific things
        alert(message);
    }
}

class Lua {
    constructor() {
        this.L = null;
        this.view = null;
        this.wasm = null;
        this.calls = {};
    };

    refreshMemory() {
        if (this.wasm.exports.memory) 
        if (this.view === null || this.view.buffer.byteLength === 0) {
            this.view = new DataView(this.wasm.exports.memory.buffer);
        }
    }

    async compile(lua_wasm_path) {
        const response = await fetch(lua_wasm_path);
        const buffer = await response.arrayBuffer();
        return await WebAssembly.compile(buffer);
    };

    async instantiate(module) {
        this.wasm = await WebAssembly.instantiate(module, {
            env: {
                ...makeEnv(this, [], lua_bindings),
                ...wasi_jmps
            },
            wasi_snapshot_preview1: makeEnv(this, wasi_snapshot_preview1_unimplemented, {
                fd_write,
                clock_time_get,
                clock_res_get
            })
        })
    
        this.calls = this.wrap_calls(this.wasm);
    
        this.refreshMemory();

        return this;
    };

    run(source) {
        this.L = this.calls.lua_init();
        const source_ptr = this.calls.malloc(source.length + 1);
        this.calls.lua_run(this.L, write_cstr(this.wasm.exports.memory, source_ptr, source));
        this.calls.free(source_ptr);
    }

    wrap_calls(instance) {
        const methods = {};
        const handler = this.handle_exception.bind(this);
        for (const [name, method] of Object.entries(instance.exports)) {
            methods[name] = function () {
                try {
                    return method(...arguments);
                } catch (e) {
                    handler(e);
                }
            }
        }
        return methods;
    }

    handle_exception(e) {
        if (e instanceof WebAssembly.RuntimeError) {
            if (!e.message.includes('unreachable')) {
                console.log(e.message);
                console.log(e.stack);
            } else {
                // Unreachable, currently reachable since setjmp/longjmp 
                // do not work in wasi-libc
                console.log('this should be unreachable');
            }
        } else if (e instanceof WebAssembly.Exception) {
            if (e.is(this.debug_tag)) {
                console.log(e.getArg(this.debug_tag, 0));
            } else {
                console.log('Unknown exception');
            }
        } else {
            console.log(e.toString());
        }
    
        this.calls.lua_end();
    }
}
