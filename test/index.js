window.onload = () => {
    lua = new Lua();

    lua.compile('../bin/lua.wasm')
        .then(module => lua.instantiate(module))
        .then(_ => {
            console.log('Lua is ready !\n\nGetting started :');
            [
                'print("Hello world")', 
                'alert("This is a pop-up!")'
            ].forEach(ex => {
                console.log(`\x1b[94m > \x1b[0m lua.\x1b[33mrun\x1b[97m(\x1b[91m'${ex}'\x1b[97m);\x1b[0m`)
            });
        })

    window.lua = lua;
}