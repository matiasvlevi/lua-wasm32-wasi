
APP_NAME = lua
VERSION = 0.0.1
LUA_VERSION=5.4.7

SRCDIR = src
BINDIR = bin

MACROS=-D'LU5_VERSION="$(VERSION)"'
LUA_SRC=include/lua

LUA_A = $(LUA_SRC)/liblua.a

ALL_SRC = $(wildcard $(SRCDIR)/*.c)
HEADERS = $(wildcard $(SRCDIR)/*.h)

OBJ_EXT = .o.wasm
LIB_EXT = .a.wasm
BIN_EXT = .wasm

# WASM setup
WASI_SDK_PATH ?= /opt/wasi-sdk-24
CC := $(WASI_SDK_PATH)/bin/clang
AR := $(WASI_SDK_PATH)/bin/llvm-ar
RANLIB := $(WASI_SDK_PATH)/bin/llvm-ranlib

BIN = $(BINDIR)/$(APP_NAME)$(BIN_EXT)
OBJDIR = $(BINDIR)/$(PLATFORM)/obj
CFLAGS = \
	-mllvm -wasm-enable-sjlj\
	--target=wasm32-wasi\
	--sysroot=$(WASI_SDK_PATH)/share/wasi-sysroot\
	-I$(WASI_SDK_PATH)/share/wasi-sysroot/include\
	-I$(LUA_SRC)\
	-DLU5_WASM\
	-D_WASI_EMULATED_SIGNAL\
	-D_WASI_EMULATED_PROCESS_CLOCKS\
	-DLUA_USE_C89

LDFLAGS = \
	--sysroot=$(WASI_SDK_PATH)/share/wasi-sysroot\
	--target=wasm32-wasi\
	-Wl,-u__wasm_longjmp\
	-lsetjmp\
	-lwasi-emulated-process-clocks\
	-Wl,-mllvm,-wasm-enable-sjlj\
	-Wl,--export=malloc,\
	-Wl,--export=free,\
	-Wl,--no-entry,

SOURCES=$(ALL_SRC)

LUA_A := $(LUA_A:.a=$(LIB_EXT))

OBJECTS := $(patsubst $(SRCDIR)/%.c,$(OBJDIR)/%$(OBJ_EXT),$(SOURCES))

all: $(BIN)

# Build lua static library
$(LUA_A):
	cd $(LUA_SRC) && make PLATFORM=wasm

# Build object files
$(OBJDIR)/%$(OBJ_EXT): src/%.c $(LUA_A) $(HEADERS)
	@mkdir -p $(dir $@)
	$(CC) -MMD -c $< -o $@ $(CFLAGS) $(MACROS)

# Link all togheter
$(BIN): $(OBJECTS) $(LUA_A)
	@mkdir -p $(dir $@)
	$(CC) -o $@ $^  $(CFLAGS) $(LDFLAGS)

clean:
	rm -rf $(BIN)

.PHONY: all clean