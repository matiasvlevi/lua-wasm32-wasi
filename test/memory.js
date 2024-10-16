function get_cstr(mem, ptr, len) {
    if (!mem) return '';
    if (len !== undefined) {
        let str_buffer = new Uint8Array(mem.buffer, ptr, len);
        return new TextDecoder().decode(str_buffer);
    }

    // Null terminated
    let str_buffer = new Uint8Array(mem.buffer, ptr, mem.buffer.byteLength - ptr);
    return new TextDecoder().decode(
        str_buffer.subarray(0, str_buffer.indexOf(0))
    );
}

function write_cstr(mem, ptr, str_value, len = -1) {
    if (!mem) return;
    
    let encoder = new TextEncoder();
    let encodedString = encoder.encode(str_value);

    // Add null terminator
    let nullTerminatedString = new Uint8Array(encodedString.length + ((len === -1) ? 1 : 0));
    nullTerminatedString.set(encodedString);
    if (len === -1) nullTerminatedString[encodedString.length] = 0;  // null terminator

    let i8 = new Uint8Array(mem.buffer);

    // Check for buffer overflow
    if ((ptr + nullTerminatedString.length) >= mem.buffer.byteLength) {
        console.log('write_cstr Memory overflow');
        return;
    }

    i8.set(nullTerminatedString, ptr);

    return ptr;
}