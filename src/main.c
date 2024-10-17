#include <stdio.h>

#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>

#include "attributes.h"

// Open an alert pop-up in the browser (this is a JS call)
_wasm_import("env", "alert") 
void js_alert(const char *message);

// alert lua binding
static int alert(lua_State *L)
{
    const char *message = lua_tostring(L, 1);
    js_alert(message);
}

// print lua binding
static int print(lua_State *L)
{
    printf("%s\n", lua_tostring(L, 1));
    fflush(stdout);
}

/*********************************
 * Create a lua state
 */
_wasm_export("lua_init") 
lua_State *lua_init(void) 
{
    lua_State *L = luaL_newstate();

    // Bind globals
    lua_pushcfunction(L, print);
    lua_setglobal(L, "print");

    lua_pushcfunction(L, alert);
    lua_setglobal(L, "alert");

    return L;
}

/*********************************
 * Run a lua script from a lua source code string
 * throw if error is found
 */
_wasm_export("lua_run")
int lua_run(lua_State *L, const char *source) 
{
    if (luaL_dostring(L, source) != LUA_OK) {
        luaL_error(L, lua_tostring(L, -1));
    }

    return 0;
}

/*********************************
 * Close a lua state
 */
_wasm_export("lua_end")
void lua_end(lua_State *L) 
{
    if (L != NULL) {
        lua_gc(L, LUA_GCCOLLECT, 0);
        lua_close(L);
        L = NULL;
    }
}