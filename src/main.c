#include <stdio.h>

#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>

#include "luact.h"

static int print(lua_State *L)
{
    printf("%s\n", lua_tostring(L, 1));
    fflush(stdout);
}

WASM_EXPORT("luact_init")
lua_State *luact_init(void) 
{
    lua_State *L = luaL_newstate();

    lua_pushcfunction(L, print);
    lua_setglobal(L, "print");

    return L;
}

WASM_EXPORT("luact_run")
int luact_run(lua_State *L, const char *source) 
{
    if (luaL_dostring(L, source) != LUA_OK) {
        luaL_error(L, lua_tostring(L, -1));
    }

    return 0;
}

WASM_EXPORT("luact_close")
void luact_close(lua_State *L) 
{
	if (L != NULL) {
		lua_gc(L, LUA_GCCOLLECT, 0);
		lua_close(L);
		L = NULL;
	}
}
