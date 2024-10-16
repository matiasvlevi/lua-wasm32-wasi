let stderr_buf = '';

function fd_write(fd,
    iovecs,
    iovec_len,
    nwritten) {
    if (!this.wasm) return;
    this.refreshMemory();
    const memory = this.view.buffer;

    let totalBytesWritten = 0;
    const buffers = [];

    for (let i = 0; i < iovec_len; i++) {
        const iovec_ptr = iovecs + (i * 8);

        if (iovec_ptr < 0 || (iovec_ptr + 8) > memory.byteLength) {
            this.error(`fd_write: iovec_ptr (${iovec_ptr}) out of bounds at iovec index ${i}`);
            continue;
        }

        const ptr = this.view.getUint32(iovec_ptr, true);
        const size = this.view.getUint32(iovec_ptr + 4, true);

        if (ptr < 0 || (ptr + size) > memory.byteLength) {
            this.error(`fd_write: Data pointer (${ptr}) out of bounds or invalid size at iovec index ${i}`);
            continue;
        }

        if (size <= 0) continue;

        // Extract buffer data
        const buffer = new Uint8Array(this.view.buffer, ptr, size);
        buffers.push(buffer);
        totalBytesWritten += size;
    }

    // Concatenate all buffers
    let combinedBuffer = new Uint8Array(totalBytesWritten);
    let offset = 0;
    buffers.forEach(buffer => {
        combinedBuffer.set(buffer, offset);
        offset += buffer.length;
    });

    let str = new TextDecoder().decode(combinedBuffer);

    // Log in console
    switch (fd) {
        case 1: console.log(str); break;
        case 2: {    
            stderr_buf += str;
            if (str.includes('\n')) {
                console.error(stderr_buf);
                stderr_buf = '';    
            }
            break;
        }
        default: console.error('fd_write: unknown file descriptor'); return 1;
    }

    // Write the total written size at the specified location
    let writtenBytes = totalBytesWritten
    if (this.view)
        this.view.setUint32(nwritten, writtenBytes, true);

    return 0;
}

function clock_res_get(_clockId,
    resolution) {
    if (this.view)
        this.view.setBigUint64(resolution, 1000n, true);
    return 0;
}

function clock_time_get(_clockId,
    _precision,
    time) {
    if (this.view)
        this.view.setBigUint64(time, BigInt(Date.now()) * 1_000_000n, true)
    return 0;
}