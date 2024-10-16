function makeEnv(bind, symbols, implemented) {
    const env = {};
    const syms = [...new Set([...symbols, ...Object.keys(implemented)])];
    for (let sym of syms) {
        env[sym] = (implemented[sym] == undefined) ? (() => 0) : implemented[sym].bind(bind);
    }
    return env;
}

const luact_bindings = {

}

class Luact {
    constructor() {
        this.L = null;
        this.view = null;
        this.wasm = null;
        this.calls = {};
    };

    async compile(luact_wasm_path) {
        const response = await fetch(luact_wasm_path);
        const buffer = await response.arrayBuffer();
        return await WebAssembly.compile(buffer);
    };

    async instantiate(module) {
        this.wasm = await WebAssembly.instantiate(module, {
            env: {
                ...makeEnv(this, [], luact_bindings),
                ...Luact.env
            },
            wasi_snapshot_preview1: makeEnv(this, wasi_snapshot_preview1_unimplemented, {
                fd_write,
                clock_time_get,
                clock_res_get
            })
        })
    
        this.calls = this.wrap_calls(this.wasm);
    
        return this;
    };

    refreshMemory() {
        if (this.wasm.exports.memory) 
        if (this.view === null || this.view.buffer.byteLength === 0) {
            this.view = new DataView(this.wasm.exports.memory.buffer);
        }
    }

    run(source) {
        this.L = this.calls.luact_init();
        const source_ptr = this.calls.malloc(source.length + 1);
        this.calls.luact_run(this.L, write_cstr(this.wasm.exports.memory, source_ptr, source));
        this.calls.free(source_ptr);
    }

    static env = {
        getTempRet0:() => 0,
        saveSetjmp:() => 0,
        testSetjmp:() => 0
    };

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
    
        this.calls.luact_close();
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
}

window.onload = () => {
    luact = new Luact();

    luact.compile('../bin/luact.wasm')
        .then(module => luact.instantiate(module))
        .then(_ => {
            console.log(`
Luact is ready !

Getting started:

\x1b[94m>\x1b[0m \x1b[90mluact.run('print("Hello world")');\x1b[0m
            `);
        })

    window.luact = luact;
}